import { initializeApp } from 'firebase-admin/app';
import { initializeFirestore } from 'firebase-admin/firestore';

const app = initializeApp();
initializeFirestore(app, { preferRest: true });
