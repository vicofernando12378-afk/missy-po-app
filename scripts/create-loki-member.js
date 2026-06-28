import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

async function registerLoki() {
  const memberData = {
    nombre_tutor: 'Okekeloko loko',
    nombre_mascota: 'Loki',
    email: 'golivaloku123@gmail.com',
    celular: '959371192',
    direccion: 'coop. Univ. i 1', // Direccion from Vi Safic or let's use a placeholder if we don't have it, wait. Vi Safic's address was 'coop. Univ. i 1'
    documento_tipo: 'DNI',
    documento_numero: '29416883',
    benefit_origen: 'Registro Automático Compra',
    puntos: 50,
    creado_en: serverTimestamp()
  };

  const newDoc = await addDoc(collection(db, 'myp_club_miembros'), memberData);
  console.log("Socio creado con ID:", newDoc.id);

  await addDoc(collection(db, 'myp_club_miembros', newDoc.id, 'puntos_logs'), {
    puntos: 50,
    motivo: 'Puntos acumulados por primera compra en pedido #B8cpfJNeYQQoPcDOHFsY',
    creado_en: serverTimestamp()
  });
  console.log("Log de puntos creado.");
}

registerLoki().catch(console.error);
