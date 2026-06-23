import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, deleteDoc, getDocs, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ============================================================
// MANUAL ENV LOADER
// ============================================================
function loadEnv() {
  try {
    const envPath = path.resolve('.env');
    if (!fs.existsSync(envPath)) {
      console.warn('⚠️ No se encontró el archivo .env. Usando variables de entorno existentes.');
      return;
    }
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
    console.log('✅ Variables de entorno cargadas desde .env');
  } catch (e) {
    console.error('❌ Error cargando .env manualmente:', e);
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const UPLOADS_DIR = path.resolve('legacy/uploads');
const DATABASE_SQL = path.resolve('legacy/database.sql');

// ============================================================
// PARSER DE PHP SERIALIZE (ATRIBUTOS WOOCOMMERCE)
// ============================================================
function parsePHPSerialize(str) {
  if (!str) return null;
  let offset = 0;
  
  function readType() {
    const type = str[offset];
    offset += 2; // skip type and colon
    return type;
  }
  
  function readLength() {
    const end = str.indexOf(':', offset);
    const length = parseInt(str.substring(offset, end), 10);
    offset = end + 1;
    return length;
  }
  
  function readValue() {
    const type = readType();
    switch (type) {
      case 's': {
        const len = readLength();
        offset++; // skip opening quote
        const val = str.substring(offset, offset + len);
        offset += len + 2; // skip value and closing quote + semicolon
        return val;
      }
      case 'i': {
        const end = str.indexOf(';', offset);
        const val = parseInt(str.substring(offset, end), 10);
        offset = end + 1;
        return val;
      }
      case 'd': {
        const end = str.indexOf(';', offset);
        const val = parseFloat(str.substring(offset, end));
        offset = end + 1;
        return val;
      }
      case 'b': {
        const end = str.indexOf(';', offset);
        const val = str.substring(offset, end) === '1';
        offset = end + 1;
        return val;
      }
      case 'n': {
        return null;
      }
      case 'a': {
        const len = readLength();
        offset++; // skip opening brace '{'
        const obj = {};
        for (let i = 0; i < len; i++) {
          const k = readValue();
          const v = readValue();
          obj[k] = v;
        }
        offset++; // skip closing brace '}'
        if (str[offset] === ';') offset++; // skip semicolon
        return obj;
      }
      default:
        return null;
    }
  }
  
  try {
    return readValue();
  } catch (e) {
    return null;
  }
}

// ============================================================
// SQL VALUE PARSER (STATE MACHINE)
// ============================================================
function parseSqlValues(line) {
  const match = line.match(/VALUES\s*\((.*)\);?$/i);
  if (!match) return null;
  const valuesStr = match[1];
  const result = [];
  let inString = false;
  let escape = false;
  let currentVal = '';
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    if (escape) {
      currentVal += char;
      escape = false;
    } else if (char === '\\') {
      escape = true;
    } else if (char === '\'') {
      inString = !inString;
    } else if (char === ',' && !inString) {
      result.push(cleanVal(currentVal));
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(cleanVal(currentVal));
  return result;
}

function cleanVal(val) {
  val = val.trim();
  if (val === 'NULL') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.substring(1, val.length - 1);
  }
  return val;
}

// ============================================================
// MIGRACIÓN PRINCIPAL
// ============================================================
async function runMigration() {
  console.log('🚀 Iniciando Migración de Catálogo WordPress → Firestore');
  
  const skippedImages = [];

  // 1. Limpiar colección como se pidió
  console.log('🧹 Limpiando colección myp_productos...');
  const colRef = collection(db, 'myp_productos');
  const snapshot = await getDocs(colRef);
  let deleteBatch = writeBatch(db);
  let delCount = 0;
  for (const docSnap of snapshot.docs) {
    deleteBatch.delete(docSnap.ref);
    delCount++;
    if (delCount % 500 === 0) {
      await deleteBatch.commit();
      deleteBatch = writeBatch(db);
    }
  }
  if (delCount % 500 !== 0) {
    await deleteBatch.commit();
  }
  console.log(`🧹 Colección limpiada. Se eliminaron ${delCount} productos antiguos.`);

  // 2. Parsear el archivo SQL
  console.log('📖 Parseando archivo SQL database.sql...');
  const fileStream = fs.createReadStream(DATABASE_SQL);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const posts = {};
  const postmeta = {};
  const terms = {};
  const termTaxonomy = {};
  const termRelationships = [];

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `SERVMASK_PREFIX_posts`')) {
      const values = parseSqlValues(line);
      if (values) {
        const [ID, , , , post_content, post_title, post_excerpt, post_status, , , , post_name, , , , , , post_parent, guid, menu_order, post_type, post_mime_type] = values;
        posts[Number(ID)] = { 
          ID: Number(ID), 
          post_content, 
          post_title, 
          post_excerpt, 
          post_status, 
          post_name, 
          post_parent: Number(post_parent), 
          guid, 
          post_type, 
          post_mime_type 
        };
      }
    } else if (line.startsWith('INSERT INTO `SERVMASK_PREFIX_postmeta`')) {
      const values = parseSqlValues(line);
      if (values) {
        const [, post_id, meta_key, meta_value] = values;
        const pId = Number(post_id);
        if (!postmeta[pId]) postmeta[pId] = {};
        postmeta[pId][meta_key] = meta_value;
      }
    } else if (line.startsWith('INSERT INTO `SERVMASK_PREFIX_terms`')) {
      const values = parseSqlValues(line);
      if (values) {
        const [term_id, name, slug] = values;
        terms[Number(term_id)] = { term_id: Number(term_id), name, slug };
      }
    } else if (line.startsWith('INSERT INTO `SERVMASK_PREFIX_term_taxonomy`')) {
      const values = parseSqlValues(line);
      if (values) {
        const [term_taxonomy_id, term_id, taxonomy] = values;
        termTaxonomy[Number(term_taxonomy_id)] = { 
          term_taxonomy_id: Number(term_taxonomy_id), 
          term_id: Number(term_id), 
          taxonomy 
        };
      }
    } else if (line.startsWith('INSERT INTO `SERVMASK_PREFIX_term_relationships`')) {
      const values = parseSqlValues(line);
      if (values) {
        const [object_id, term_taxonomy_id] = values;
        termRelationships.push({ 
          object_id: Number(object_id), 
          term_taxonomy_id: Number(term_taxonomy_id) 
        });
      }
    }
  }

  console.log(`✅ SQL Parseado.`);
  console.log(`   - Posts totales cargados: ${Object.keys(posts).length}`);
  console.log(`   - Relaciones de taxonomía: ${termRelationships.length}`);

  // 3. Agrupar categorías y etiquetas por producto
  const productTerms = {};
  termRelationships.forEach(rel => {
    const { object_id, term_taxonomy_id } = rel;
    const taxInfo = termTaxonomy[term_taxonomy_id];
    if (taxInfo) {
      const term = terms[taxInfo.term_id];
      if (term) {
        if (!productTerms[object_id]) {
          productTerms[object_id] = { categories: [], tags: [] };
        }
        if (taxInfo.taxonomy === 'product_cat') {
          productTerms[object_id].categories.push(term.name);
        } else if (taxInfo.taxonomy === 'product_tag') {
          productTerms[object_id].tags.push(term.name);
        }
      }
    }
  });

  // 4. Filtrar y procesar los productos principales (post_type = 'product')
  const products = Object.values(posts).filter(p => p.post_type === 'product' && p.post_status === 'publish');
  console.log(`🐾 Productos activos a procesar: ${products.length}`);

  let successCount = 0;

  for (const product of products) {
    const pId = product.ID;
    const meta = postmeta[pId] || {};

    const sku = meta['_sku'] || `myp-wp-${pId}`;
    const regularPrice = parseFloat(meta['_regular_price']) || 0;
    const salePrice = meta['_sale_price'] ? parseFloat(meta['_sale_price']) : null;
    const price = parseFloat(meta['_price']) || regularPrice;
    const stock = meta['_manage_stock'] === 'yes' ? (parseInt(meta['_stock']) || 0) : 999;
    const stockStatus = meta['_stock_status'] || 'instock';

    // Obtener categorías y tags
    const pTerms = productTerms[pId] || { categories: [], tags: [] };

    // Decodificar atributos
    let rawAttributes = {};
    if (meta['_product_attributes']) {
      const parsedAttr = parsePHPSerialize(meta['_product_attributes']);
      if (parsedAttr && typeof parsedAttr === 'object') {
        Object.keys(parsedAttr).forEach(key => {
          const attrInfo = parsedAttr[key];
          if (attrInfo && typeof attrInfo === 'object') {
            rawAttributes[attrInfo.name] = {
              name: attrInfo.name,
              value: attrInfo.value,
              is_variation: attrInfo.is_variation === 1 || attrInfo.is_variation === true
            };
          }
        });
      }
    }

    // Buscar variantes del producto (variations)
    const variations = Object.values(posts).filter(p => p.post_type === 'product_variation' && p.post_parent === pId);
    const mappedVariations = variations.map(v => {
      const vId = v.ID;
      const vMeta = postmeta[vId] || {};
      const vSku = vMeta['_sku'] || `${sku}-var-${vId}`;
      const vPrice = parseFloat(vMeta['_price']) || price;
      const vStock = vMeta['_manage_stock'] === 'yes' ? (parseInt(vMeta['_stock']) || 0) : 999;

      // Atributos de variación (ej. attribute_pa_color-ropa)
      const vAttributes = {};
      Object.keys(vMeta).forEach(key => {
        if (key.startsWith('attribute_')) {
          const attrName = key.replace('attribute_', '');
          vAttributes[attrName] = vMeta[key];
        }
      });

      return {
        id: vId,
        sku: vSku,
        precio: vPrice,
        stock: vStock,
        atributos: vAttributes
      };
    });

    // Subir imágenes y resolver URLs
    const imageUrls = [];
    const imageIds = [];

    // Featured image
    if (meta['_thumbnail_id']) {
      imageIds.push(Number(meta['_thumbnail_id']));
    }
    // Gallery
    if (meta['_product_image_gallery']) {
      const galleryIds = meta['_product_image_gallery']
        .split(',')
        .map(id => Number(id.trim()))
        .filter(id => id > 0);
      imageIds.push(...galleryIds);
    }

    // Procesar cada archivo de imagen
    for (const imgId of imageIds) {
      const imgPost = posts[imgId];
      if (imgPost) {
        const imgMeta = postmeta[imgId] || {};
        const relPath = imgMeta['_wp_attached_file']; // e.g. 2022/04/image.jpg

        if (relPath) {
          // Filtro: Solo considerar carpetas 2022 y 2023
          const matchesFolder = relPath.startsWith('2022/') || relPath.startsWith('2023/');
          if (matchesFolder) {
            const localFilePath = path.join(UPLOADS_DIR, relPath.replace(/\//g, path.sep));
            if (fs.existsSync(localFilePath)) {
              const stats = fs.statSync(localFilePath);
              const sizeInMB = stats.size / (1024 * 1024);
              
              if (sizeInMB > 1.0) {
                console.warn(`   ⚠️ Imagen omitida por exceso de tamaño (> 1.0 MB): ${relPath} (${sizeInMB.toFixed(2)} MB)`);
                skippedImages.push({ relPath, sizeInMB });
                // Guardar ruta de respaldo local
                imageUrls.push(`/uploads/${relPath}`);
                continue;
              }

              const fileName = path.basename(localFilePath);
              const storageRefPath = `myp/productos/${sku}/${fileName}`;
              
              try {
                console.log(`📤 Subiendo ${fileName} a Storage (${storageRefPath})...`);
                const fileBuffer = fs.readFileSync(localFilePath);
                const fileRef = ref(storage, storageRefPath);
                
                await uploadBytes(fileRef, fileBuffer, {
                  contentType: imgPost.post_mime_type || 'image/jpeg'
                });
                
                const downloadUrl = await getDownloadURL(fileRef);
                imageUrls.push(downloadUrl);
                console.log(`   ✅ Subido exitosamente: ${downloadUrl}`);
              } catch (err) {
                console.warn(`   ⚠️ No se pudo subir imagen a Storage (${err.message}). Guardando ruta de respaldo.`);
                // Fallback a un link local simulado o placeholder
                imageUrls.push(`/uploads/${relPath}`);
              }
            } else {
              console.warn(`   ⚠️ Archivo local no existe en disco: ${localFilePath}`);
            }
          }
        }
      }
    }

    // Si no tiene imágenes válidas, poner placeholder
    if (imageUrls.length === 0) {
      imageUrls.push('https://via.placeholder.com/600?text=Missy%20And%20Po');
    }

    // Generar tags de búsqueda para LiveSearch (array-contains)
    const searchWords = new Set();
    if (sku) searchWords.add(sku.toLowerCase().trim());
    
    // Separar palabras del título quitando caracteres de puntuación
    const titleClean = product.post_title.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '')
      .trim();
    if (titleClean) {
      titleClean.split(/\s+/).filter(w => w.length > 1).forEach(w => searchWords.add(w));
    }
    
    // Agregar palabras de categorías y tags
    pTerms.categories.forEach(cat => {
      cat.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '').split(/\s+/)
        .filter(w => w.length > 1).forEach(w => searchWords.add(w));
    });
    pTerms.tags.forEach(tag => {
      tag.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '').split(/\s+/)
        .filter(w => w.length > 1).forEach(w => searchWords.add(w));
    });
    
    const tagsBusqueda = Array.from(searchWords);

    // Construir documento de Firestore
    const productDoc = {
      id: pId,
      nombre: product.post_title,
      descripcion: product.post_content,
      descripcion_corta: product.post_excerpt,
      slug: product.post_name,
      sku,
      precio_regular: regularPrice,
      precio_oferta: salePrice,
      precio: price,
      stock,
      stock_status: stockStatus,
      categorias: pTerms.categories,
      tags: pTerms.tags,
      imagenes: imageUrls,
      atributos: rawAttributes,
      variantes: mappedVariations,
      activo: true,
      tags_busqueda: tagsBusqueda,
      destacado: pTerms.categories.some(cat => cat.toLowerCase().includes('destacado')) || false,
      fecha_creacion: new Date().toISOString()
    };

    // Guardar en Firestore
    try {
      const docRef = doc(db, 'myp_productos', sku); // Usamos SKU como clave de documento
      await setDoc(docRef, productDoc);
      successCount++;
      console.log(`🐾 [${successCount}/${products.length}] Migrado producto: ${product.post_title} (SKU: ${sku})`);
    } catch (err) {
      console.error(`❌ Error guardando producto en Firestore: ${product.post_title}`, err);
    }
  }

  console.log(`\n🎉 MIGRACIÓN COMPLETADA CON ÉXITO!`);
  console.log(`   - Productos migrados a Firestore: ${successCount}`);
  if (skippedImages.length > 0) {
    console.log(`\n⚠️ IMÁGENES NO OPTIMIZADAS OMITIDAS (> 1.0 MB) (TOTAL: ${skippedImages.length}):`);
    skippedImages.forEach(img => {
      console.log(`   - [${img.sizeInMB.toFixed(2)} MB] ${img.relPath}`);
    });
  } else {
    console.log(`\n✅ Todas las imágenes estaban por debajo del límite de 1.0 MB y se subieron.`);
  }
}

runMigration().catch(err => {
  console.error('❌ Error crítico en la ejecución de la migración:', err);
});
