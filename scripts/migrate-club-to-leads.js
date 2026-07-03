/**
 * migrate-club-to-leads.js
 *
 * One-shot migration: reads all myp_club_miembros and creates a crm_lead
 * for each one with source="club" and stage="cliente".
 *
 * Usage (from project root):
 *   node scripts/migrate-club-to-leads.js [--dry-run]
 *
 * Idempotent: skips leads that already exist (matched by email).
 * Requires GOOGLE_APPLICATION_CREDENTIALS or firebase-admin default credentials.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

// Initialize admin SDK
if (!getApps().length) {
  // Try service account file first, fall back to default credentials (Cloud Shell / CI)
  try {
    const saPath = resolve(__dirname, '../.service-account.json');
    const sa = JSON.parse(readFileSync(saPath, 'utf8'));
    initializeApp({ credential: cert(sa) });
    console.log('✅ Authenticated via service account');
  } catch {
    initializeApp(); // ADC
    console.log('✅ Authenticated via Application Default Credentials');
  }
}

const db = getFirestore();

async function migrateClubToLeads() {
  console.log(`\n🔄 ${DRY_RUN ? '[DRY RUN] ' : ''}Migrating myp_club_miembros → crm_leads\n`);

  // Load existing leads by email to avoid duplicates
  const existingLeadsSnap = await db.collection('crm_leads')
    .where('source', '==', 'club')
    .get();

  const existingEmails = new Set(
    existingLeadsSnap.docs
      .map(d => d.data().email?.toLowerCase())
      .filter(Boolean)
  );
  console.log(`ℹ️  ${existingEmails.size} existing club leads found — will skip duplicates`);

  // Load all club members
  const miembrosSnap = await db.collection('myp_club_miembros').get();
  console.log(`ℹ️  ${miembrosSnap.size} club members found\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  const now = Timestamp.now();
  const batch = db.batch();
  let batchCount = 0;

  for (const miembroDoc of miembrosSnap.docs) {
    const m = miembroDoc.data();
    const email = m.email?.trim().toLowerCase() || null;

    // Skip if already migrated
    if (email && existingEmails.has(email)) {
      console.log(`  ⏭️  Skipping ${m.nombre_tutor} (${email}) — already in crm_leads`);
      skipped++;
      continue;
    }

    const leadPayload = {
      name: m.nombre_tutor?.trim() || 'Desconocido',
      phone: m.celular?.trim() || null,
      email: email,
      petName: m.nombre_mascota?.trim() || null,
      petAlias: m.nombre_mascota?.trim() || null,
      source: 'club',
      sourceDetail: {
        clubMiembroId: miembroDoc.id,
        benefitOrigen: m.benefit_origen || 'General',
      },
      stage: 'cliente',
      score: 30,               // New clients start with +30 (purchase event equivalent)
      tags: ['club-migrado'],
      segmentIds: [],
      consent: {
        whatsapp: false,
        email: !!email,        // If they have email, assume email consent (registered voluntarily)
        telegram: false,
      },
      assignedTo: null,
      points: parseInt(m.puntos) || 0,
      createdAt: m.creado_en || now,
      updatedAt: now,
      lastInteractionAt: m.actualizado_en || m.creado_en || null,
    };

    if (DRY_RUN) {
      console.log(`  🔍 [DRY RUN] Would create lead: ${leadPayload.name} (${leadPayload.email})`);
      created++;
      continue;
    }

    try {
      const newRef = db.collection('crm_leads').doc();
      batch.set(newRef, leadPayload);
      batchCount++;

      // Firestore batch limit = 500 writes
      if (batchCount >= 499) {
        await batch.commit();
        console.log(`  ✅ Committed batch of ${batchCount}`);
        batchCount = 0;
      }

      created++;
      console.log(`  ✅ Created lead: ${leadPayload.name} (${leadPayload.email || 'no email'})`);
    } catch (err) {
      console.error(`  ❌ Error migrating ${m.nombre_tutor}: ${err.message}`);
      errors++;
    }
  }

  // Commit remaining
  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`  ✅ Committed final batch of ${batchCount}`);
  }

  console.log(`
📊 Migration summary:
   Created : ${created}
   Skipped : ${skipped} (duplicates)
   Errors  : ${errors}
   Mode    : ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}
`);
}

migrateClubToLeads().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
