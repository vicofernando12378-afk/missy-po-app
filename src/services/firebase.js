// ============================================================
// FIREBASE — Inicialización SDK
// Missy & Po Pet Shop | Proyecto Firebase EXCLUSIVO
// Prefijo colecciones: myp_
// ============================================================
// INSTRUCCIONES:
//   1. Copia .env.example → .env
//   2. Rellena las variables con los datos de tu proyecto Firebase
//   3. Nunca comitees el archivo .env

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.PUBLIC_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.PUBLIC_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID,
};


// Evitar re-inicialización en hot-reload
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// Inicializar Firestore con persistencia local (caché en IndexedDB)
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  db = getFirestore(app);
}

export { db };
export const storage = getStorage(app);
export const auth    = getAuth(app);
export const functions = getFunctions(app);
export default app;
