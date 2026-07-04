/**
 * generateProductCatalog.js — Scheduled function to refresh product catalog.
 *
 * Runs every 5 days at 4:00 AM Lima time.
 * Generates JSON (for bot) + CSV (for Google/Meta) from Firestore myp_productos.
 * Creates admin notification if catalog is outdated.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { generateCatalog, checkCatalogStatus } from '../lib/productCatalog.js';

export const generateProductCatalog = onSchedule({
  schedule: '0 4 1,6,11,16,21,26 * *',
  timezone: 'America/Lima',
  region: 'us-central1',
  retryCount: 2,
}, async () => {
  console.log('[generateProductCatalog] Starting catalog generation...');

  try {
    const result = await generateCatalog();
    console.log(`[generateProductCatalog] Generated: ${result.productCount} products`);

    // Check if admin notification is needed
    const status = await checkCatalogStatus();
    if (status.outdated) {
      const db = getFirestore();
      await db.collection('crm_notifications').add({
        type: 'catalog_outdated',
        title: 'Catálogo de productos actualizado',
        message: `Se generó un nuevo catálogo con ${result.productCount} productos para el bot de Telegram.`,
        read: false,
        createdAt: Timestamp.fromDate(new Date()),
      });
      console.log('[generateProductCatalog] Admin notification created');
    }

    return { success: true, productCount: result.productCount };
  } catch (err) {
    console.error('[generateProductCatalog] Error:', err);
    throw err;
  }
});
