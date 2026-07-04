/**
 * refreshProductCatalog.js — Manual trigger for catalog regeneration.
 * Called from admin panel when products change or user clicks "Actualizar catálogo".
 */
import { onRequest } from 'firebase-functions/v2/https';
import { generateCatalog } from '../lib/productCatalog.js';

export const refreshProductCatalog = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  try {
    const result = await generateCatalog();
    res.json({
      success: true,
      productCount: result.productCount,
      csv: result.csv,
      generatedAt: result.generatedAt?.toDate?.() || new Date(),
    });
  } catch (err) {
    console.error('[refreshProductCatalog] Error:', err);
    res.status(500).json({ error: err.message });
  }
});
