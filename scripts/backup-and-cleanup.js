import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, deleteDoc } from 'firebase/firestore';

// ============================================================
// MANUAL ENV LOADER
// ============================================================
function loadEnv() {
  try {
    const envPath = path.resolve('.env');
    if (!fs.existsSync(envPath)) {
      console.warn('⚠️ No se encontró el archivo .env. Usando variables de entorno del sistema.');
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runBackupAndCleanup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const collections = ['myp_productos', 'myp_pedidos', 'myp_reviews', 'myp_cupones', 'myp_caja_diaria', 'myp_config'];
  
  console.log('📦 INICIANDO RESPALDO DE CLOUD FIRESTORE...');
  
  for (const colName of collections) {
    try {
      console.log(`⏳ Descargando colección "${colName}"...`);
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      const data = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
      
      const backupPath = path.join(backupDir, `${colName}_backup_${timestamp}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`   ✅ Guardado localmente: ${backupPath} (${data.length} documentos)`);
      
      if (colName === 'myp_productos') {
        console.log('\n🧹 ANALIZANDO PRODUCTOS PARA ELIMINACIÓN (Precio == 0 & Descripción Larga)...');
        
        // 1. Filtrar los que tienen precio 0 (regular o de venta)
        const priceZeroProducts = data.filter(p => {
          const regPrice = p.precio_regular !== undefined ? p.precio_regular : 0;
          const price = p.precio !== undefined ? p.precio : 0;
          return regPrice === 0 || price === 0;
        });

        console.log(`🔍 Encontrados ${priceZeroProducts.length} productos con precio CERO en total.`);

        // 2. Filtrar por descripción larga (> 1000 caracteres)
        const toDelete = [];
        const toKeep = [];

        priceZeroProducts.forEach(p => {
          const descLength = p.descripcion ? p.descripcion.length : 0;
          if (descLength > 1000) {
            toDelete.push({ ...p, descLength });
          } else {
            toKeep.push({ ...p, descLength });
          }
        });
        
        console.log(`📊 Filtro por longitud de descripción (> 1000 caracteres):`);
        console.log(`   - A eliminar (AliExpress/WordPress importados): ${toDelete.length}`);
        console.log(`   - A conservar (descripción corta o vacía): ${toKeep.length}`);
        
        if (toKeep.length > 0) {
          console.log('\n📌 Productos con precio 0 que se CONSERVARÁN (descripción corta):');
          toKeep.forEach(p => {
            console.log(`   - [ID: ${p.id}] SKU: ${p.sku} | Nombre: ${p.nombre} | Desc. Longitud: ${p.descLength}`);
          });
        }

        if (toDelete.length > 0) {
          console.log('\n📋 Productos que se ELIMINARÁN permanentemente de Firestore:');
          toDelete.forEach(p => {
            console.log(`   - [ID: ${p.id}] SKU: ${p.sku} | Nombre: ${p.nombre} | Desc. Longitud: ${p.descLength}`);
          });
          
          console.log('\n🔥 Iniciando eliminación física en Firestore...');
          let count = 0;
          for (const p of toDelete) {
            // El ID del documento en la colección es su id de base de datos (o SKU según setDoc en migración)
            // La migración original usaba doc(db, 'myp_productos', sku) pero también guardó el id dentro.
            // Para estar 100% seguros de eliminar la clave de documento correcta en Firestore:
            // Usamos el ID del documento obtenido directamente de d.id en snapshot.docs.map(d => ({ docId: d.id, ...d.data() }))
            const docRef = doc(db, 'myp_productos', p.docId);
            await deleteDoc(docRef);
            count++;
            console.log(`   [${count}/${toDelete.length}] Eliminado: ${p.nombre} (ID/SKU: ${p.id})`);
          }
          console.log(`\n✅ Limpieza completada con éxito. Se eliminaron ${count} productos.`);
        } else {
          console.log('\n✅ No se encontraron productos que cumplan ambas condiciones.');
        }
      }
    } catch (err) {
      console.error(`❌ Error procesando colección "${colName}":`, err);
    }
  }
  
  console.log('\n🎉 PROCESO CONCLUIDO CORRECTAMENTE!');
}

runBackupAndCleanup();
