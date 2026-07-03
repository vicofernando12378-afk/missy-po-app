/**
 * backfill-checkout-leads.js
 *
 * One-shot backfill: reads historical myp_pedidos and creates/updates crm_leads
 * matching by email (then phone). If a lead already exists, records a "purchase"
 * interaction and updates stage to "cliente".
 *
 * Usage (from project root):
 *   node scripts/backfill-checkout-leads.js [--dry-run] [--limit=500]
 *
 * Idempotent: deduplicates by email. Runs in batches of 499 writes.
 * Requires .service-account.json or ADC.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : 10000;

// Initialize admin SDK
if (!getApps().length) {
  try {
    const saPath = resolve(__dirname, '../.service-account.json');
    const sa = JSON.parse(readFileSync(saPath, 'utf8'));
    initializeApp({ credential: cert(sa) });
    console.log('✅ Authenticated via service account');
  } catch {
    initializeApp();
    console.log('✅ Authenticated via Application Default Credentials');
  }
}

const db = getFirestore();

/**
 * Finds an existing crm_lead by email (case-insensitive). Returns doc or null.
 */
async function findLeadByEmail(email) {
  if (!email) return null;
  const snap = await db.collection('crm_leads')
    .where('email', '==', email.toLowerCase())
    .limit(1)
    .get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function backfillCheckoutLeads() {
  console.log(`\n🔄 ${DRY_RUN ? '[DRY RUN] ' : ''}Backfilling myp_pedidos → crm_leads (limit: ${LIMIT})\n`);

  const pedidosSnap = await db.collection('myp_pedidos')
    .orderBy('creado_en', 'desc')
    .limit(LIMIT)
    .get();

  console.log(`ℹ️  ${pedidosSnap.size} orders found\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Process sequentially to avoid race conditions on email dedup
  for (const pedidoDoc of pedidosSnap.docs) {
    const p = pedidoDoc.data();
    const email = p.email?.trim().toLowerCase() || p.customer?.email?.trim().toLowerCase() || null;
    const phone = p.telefono?.trim() || p.customer?.phone?.trim() || null;
    const name = p.nombre_completo?.trim() || p.customer?.name?.trim() || 'Cliente sin nombre';

    if (!email && !phone) {
      console.log(`  ⏭️  Skipping order ${pedidoDoc.id} — no email or phone`);
      skipped++;
      continue;
    }

    try {
      const existingLead = await findLeadByEmail(email);

      if (existingLead) {
        // Lead exists → record purchase interaction + ensure stage = cliente
        if (DRY_RUN) {
          console.log(`  🔍 [DRY RUN] Would update lead ${existingLead.id} (${email}) with purchase interaction`);
          updated++;
          continue;
        }

        const now = Timestamp.now();
        const batch = db.batch();

        // Update lead stage + score
        const leadRef = db.collection('crm_leads').doc(existingLead.id);
        batch.update(leadRef, {
          stage: 'cliente',
          score: Math.min(100, (existingLead.score || 0) + 30),
          lastInteractionAt: p.creado_en || now,
          updatedAt: now,
        });

        // Record purchase interaction
        const interactionRef = db.collection('crm_interactions').doc();
        batch.set(interactionRef, {
          leadId: existingLead.id,
          channel: 'web',
          type: 'purchase',
          direction: 'inbound',
          content: `Pedido #${pedidoDoc.id} — S/. ${p.total || 0}`,
          mediaUrl: null,
          aiHandled: false,
          createdAt: p.creado_en || now,
        });

        await batch.commit();
        updated++;
        console.log(`  🔄 Updated lead: ${name} (${email}) — +purchase interaction`);
      } else {
        // New lead
        const now = Timestamp.now();
        const leadPayload = {
          name,
          phone,
          email,
          petName: null,
          petAlias: null,
          source: 'web',
          sourceDetail: {
            pedidoId: pedidoDoc.id,
            total: p.total || 0,
          },
          stage: 'cliente',
          score: 30, // purchase = +30
          tags: ['checkout-backfill'],
          segmentIds: [],
          consent: {
            whatsapp: false,
            email: !!email,
            telegram: false,
          },
          assignedTo: null,
          points: 0,
          createdAt: p.creado_en || now,
          updatedAt: now,
          lastInteractionAt: p.creado_en || null,
        };

        if (DRY_RUN) {
          console.log(`  🔍 [DRY RUN] Would create lead: ${name} (${email})`);
          created++;
          continue;
        }

        const batch = db.batch();
        const leadRef = db.collection('crm_leads').doc();
        batch.set(leadRef, leadPayload);

        // Record purchase interaction
        const interactionRef = db.collection('crm_interactions').doc();
        batch.set(interactionRef, {
          leadId: leadRef.id,
          channel: 'web',
          type: 'purchase',
          direction: 'inbound',
          content: `Pedido #${pedidoDoc.id} — S/. ${p.total || 0}`,
          mediaUrl: null,
          aiHandled: false,
          createdAt: p.creado_en || now,
        });

        await batch.commit();
        created++;
        console.log(`  ✅ Created lead: ${name} (${email || phone})`);
      }
    } catch (err) {
      console.error(`  ❌ Error processing order ${pedidoDoc.id}: ${err.message}`);
      errors++;
    }
  }

  console.log(`
📊 Backfill summary:
   Created : ${created}
   Updated : ${updated} (existing leads + purchase interaction)
   Skipped : ${skipped} (no email/phone)
   Errors  : ${errors}
   Mode    : ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}
`);
}

backfillCheckoutLeads().catch(err => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
