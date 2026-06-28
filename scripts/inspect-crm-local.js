import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

function loadEnv() {
  try {
    const envPath = path.resolve('.env');
    if (!fs.existsSync(envPath)) {
      console.warn('⚠️ .env not found');
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
  } catch (e) {
    console.error('Error loading env:', e);
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

async function inspect() {
  console.log("=== ÚLTIMOS MIEMBROS ===");
  const miembrosSnap = await getDocs(query(collection(db, 'myp_club_miembros')));
  miembrosSnap.forEach(doc => {
    console.log(doc.id, doc.data());
  });

  console.log("\n=== ÚLTIMOS PEDIDOS ===");
  try {
    const pedidosSnap = await getDocs(query(collection(db, 'myp_pedidos'), orderBy('creado_en', 'desc'), limit(5)));
    pedidosSnap.forEach(doc => {
      console.log(doc.id, doc.data().cliente, doc.data().puntos_canjeados, doc.data().total_final);
    });
  } catch (e) {
    console.error("Error querying pedidos:", e);
  }
}

inspect().catch(console.error);
