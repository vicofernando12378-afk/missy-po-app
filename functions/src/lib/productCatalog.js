/**
 * productCatalog.js — Product catalog generator for bot + Google/Meta feeds.
 *
 * Generates two artifacts from Firestore `myp_productos`:
 *   1. JSON — simplified catalog for bot system prompt
 *   2. CSV — Google Shopping / Meta Commerce feed format
 *
 * Stores both in Firestore `crm_config/product_catalog`.
 * Cache: 24h in-memory to avoid hammering Firestore.
 */
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
let cache = null;
let cacheExpiry = 0;

/**
 * Build simplified JSON for bot prompt.
 * Only active products, essential fields only.
 */
function buildCatalogJSON(products) {
  return products
    .filter(p => p.activo !== false)
    .map(p => {
      const price = p.precio_oferta || p.precio_regular || p.precio || 0;
      const regularPrice = p.precio_regular || p.precio || price;
      const onSale = p.precio_oferta > 0 && p.precio_oferta < regularPrice;

      return {
        id: p.sku || p.id,
        nombre: p.nombre,
        precio: price,
        precioRegular: onSale ? regularPrice : null,
        enOferta: onSale,
        stock: p.stock ?? 0,
        categorias: p.categorias || [],
        slug: p.slug || p.id,
        tags: p.tags_busqueda || [],
        imagenUrl: p.imagenes?.[0] || null,
      };
    });
}

/**
 * Build Google Shopping / Meta Commerce CSV.
 * Format: https://support.google.com/merchants/answer/7052112
 */
function buildCatalogCSV(products) {
  const header = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'sale_price',
    'link',
    'image_link',
    'brand',
    'product_type',
    'google_product_category',
  ];

  const rows = products
    .filter(p => p.activo !== false)
    .map(p => {
      const price = p.precio_oferta || p.precio_regular || p.precio || 0;
      const regularPrice = p.precio_regular || p.precio || price;
      const onSale = p.precio_oferta > 0 && p.precio_oferta < regularPrice;
      const stock = p.stock ?? 0;
      const slug = p.slug || p.id;
      const imageUrl = p.imagenes?.[0] || '';
      const categorias = (p.categorias || []).join(' > ');
      const description = (p.descripcion || p.descripcion_corta || '').substring(0, 5000);

      return [
        p.sku || p.id,
        escapeCSV(p.nombre),
        escapeCSV(description),
        stock > 0 ? 'in_stock' : 'out_of_stock',
        'new',
        `PEN ${regularPrice}`,
        onSale ? `PEN ${price}` : '',
        `https://missypoweb.web.app/producto/${slug}`,
        imageUrl,
        'Missy & Po',
        escapeCSV(categorias),
        '', // Google product category — leave empty for auto-classification
      ];
    });

  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csvContent;
}

function escapeCSV(value) {
  if (!value) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Load all active products from Firestore.
 */
async function loadProducts() {
  const db = getFirestore();
  const snap = await db.collection('myp_productos').where('activo', '!=', false).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Generate and persist the catalog (JSON + CSV).
 * Returns { json, csv, productCount, generatedAt }.
 */
export async function generateCatalog() {
  const products = await loadProducts();
  const json = buildCatalogJSON(products);
  const csv = buildCatalogCSV(products);
  const now = new Date();

  const catalog = {
    json,
    csv,
    productCount: json.length,
    generatedAt: Timestamp.fromDate(now),
  };

  // Persist to Firestore
  const db = getFirestore();
  await db.collection('crm_config').doc('product_catalog').set(catalog, { merge: true });

  // Update cache
  cache = catalog;
  cacheExpiry = Date.now() + CACHE_TTL_MS;

  console.log(`[productCatalog] Generated: ${json.length} products`);
  return catalog;
}

/**
 * Get cached catalog. Returns null if not generated yet.
 * NEVER regenerates inline — that's slow and blocks the webhook.
 */
export async function getCatalog() {
  if (cache && Date.now() < cacheExpiry) {
    return cache;
  }

  const db = getFirestore();
  const doc = await db.collection('crm_config').doc('product_catalog').get();

  if (doc.exists) {
    const data = doc.data();
    cache = data;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return data;
  }

  // Not generated yet — return null, don't block
  return null;
}

/**
 * Get JSON catalog for bot prompt injection.
 */
export async function getCatalogJSON() {
  const catalog = await getCatalog();
  return catalog?.json || [];
}

/**
 * Get CSV for download/export.
 */
export async function getCatalogCSV() {
  const catalog = await getCatalog();
  return catalog.csv || '';
}

/**
 * Check if catalog is outdated vs current active product count.
 * Returns { outdated: boolean, catalogCount: number, activeCount: number }.
 */
export async function checkCatalogStatus() {
  const db = getFirestore();

  // Get catalog count
  const catalogDoc = await db.collection('crm_config').doc('product_catalog').get();
  const catalogCount = catalogDoc.exists ? (catalogDoc.data().productCount || 0) : 0;

  // Get current active product count
  const productsSnap = await db.collection('myp_productos').where('activo', '!=', false).get();
  const activeCount = productsSnap.size;

  return {
    outdated: catalogCount !== activeCount,
    catalogCount,
    activeCount,
  };
}
