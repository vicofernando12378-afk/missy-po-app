import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

async function run() {
  console.log('Fetching products from Firestore...');
  const colRef = collection(db, 'myp_productos');
  const snap = await getDocs(colRef);
  
  let updatedCount = 0;
  for (const document of snap.docs) {
    const data = document.data();
    if (data.categorias && Array.isArray(data.categorias)) {
      const cleanCats = data.categorias.map(c => decodeHtmlEntities(c));
      const hasChanged = JSON.stringify(data.categorias) !== JSON.stringify(cleanCats);
      
      if (hasChanged) {
        const docRef = doc(db, 'myp_productos', document.id);
        await updateDoc(docRef, { categorias: cleanCats });
        updatedCount++;
        console.log(`Updated product ${document.id}: [${data.categorias.join(', ')}] -> [${cleanCats.join(', ')}]`);
      }
    }
  }
  
  console.log(`Cleanup completed! Updated ${updatedCount} products.`);
  process.exit(0);
}

run().catch(console.error);
