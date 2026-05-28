// ============================================================
// SCRIPT: Asignar Claim de Administrador en Firebase Auth
// Uso: node scripts/set-admin-claim.js <email>
// ============================================================

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../serviceAccountKey.json');
const emailToMakeAdmin = process.argv[2];

if (!emailToMakeAdmin) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: Debes especificar el correo electrónico.');
  console.log('Uso: node scripts/set-admin-claim.js correo@ejemplo.com');
  process.exit(1);
}

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: Archivo "serviceAccountKey.json" no encontrado en la raíz.');
  console.log('\nPara generar este archivo:');
  console.log('1. Ve a la consola de Firebase (https://console.firebase.google.com).');
  console.log('2. Configuración del proyecto > Cuentas de servicio.');
  console.log('3. Haz clic en "Generar nueva clave privada".');
  console.log('4. Descarga el archivo, renombralo a "serviceAccountKey.json" y colocalo en la raíz de este proyecto.');
  process.exit(1);
}

// Inicializar el SDK de Admin
try {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('\x1b[32m%s\x1b[0m', '✓ Firebase Admin inicializado correctamente.');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error al inicializar Firebase Admin SDK:', error.message);
  process.exit(1);
}

async function grantAdminRole(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    
    // Asignar custom claim admin: true
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log('\n\x1b[32m%s\x1b[0m', `🎉 ¡ÉXITO! El rol de administrador ha sido asignado a: ${email}`);
    console.log(`UID del usuario: ${user.uid}`);
    console.log('El usuario debe cerrar e iniciar sesión en la aplicación para que el cambio surta efecto.');
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('\x1b[31m%s\x1b[0m', `❌ Error: No existe ningún usuario registrado con el email "${email}".`);
      console.log('Asegúrate de registrar al usuario primero en el panel de Firebase Auth de la web.');
    } else {
      console.error('\x1b[31m%s\x1b[0m', '❌ Ocurrió un error inesperado al asignar el rol:', error.message);
    }
  }
}

grantAdminRole(emailToMakeAdmin);
