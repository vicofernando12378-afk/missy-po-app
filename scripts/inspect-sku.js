import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function run() {
  const colRef = collection(db, 'myp_productos');
  const snap = await getDocs(colRef);
  
  console.log('Searching for products...');
  snap.docs.forEach(d => {
    const data = d.data();
    // Print product info if SKU or any ID looks numeric or matches parts of the target
    const targetPrefix = '74751380';
    if (d.id.startsWith(targetPrefix) || (data.sku && String(data.sku).includes('74751380')) || (data.id && String(data.id).includes('74751380'))) {
      console.log(`MATCH: doc.id=${d.id}, sku=${data.sku}, id=${data.id}, nombre=${data.nombre}`);
    }
    
    // Also scan variants
    if (data.variantes) {
      data.variantes.forEach(v => {
        if (String(v.sku).includes(targetPrefix) || String(v.id).includes(targetPrefix)) {
          console.log(`MATCH IN VARIANT: parent.nombre=${data.nombre}, variant.id=${v.id}, variant.sku=${v.sku}`);
        }
      });
    }
  });
  
  console.log('Done scanning.');
  process.exit(0);
}

run().catch(console.error);
