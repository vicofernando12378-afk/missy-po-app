# Guía de Configuración — Captación de Redes Sociales (Meta & YouTube)

Esta guía detalla los pasos manuales requeridos para activar la captura automática de leads de Instagram, Facebook y YouTube en el CRM de Missy & Po.

---

## 1. Configuración de Meta Webhooks (Instagram y Facebook)

Para que los comentarios y DMs comerciales de Instagram y Facebook se registren como leads, debes configurar una App en el portal de desarrolladores de Meta.

### Paso 1.1: Crear la App de Meta
1. Ve a [Meta for Developers](https://developers.facebook.com/) e inicia sesión con tu cuenta de Facebook Business.
2. Haz clic en **Mis Apps** -> **Crear App**.
3. Selecciona el tipo de App: **Negocios (Business)**.
4. Completa el nombre de la app (ej: `Missy & Po CRM`) y asóciala a tu Administrador Comercial (Meta Business Manager).

### Paso 1.2: Configurar los Productos
1. En el panel de control de tu App, agrega el producto **Instagram Graph API**.
2. Agrega también el producto **Webhooks**.

### Paso 1.3: Configurar el Webhook de Meta
1. En la sección **Webhooks** del panel izquierdo, selecciona **Instagram** en el menú desplegable.
2. Haz clic en **Configurar este webhook**.
3. Completa los campos:
   *   **URL de retorno:** La dirección pública de tu Cloud Function (ej: `https://us-central1-missy-po.cloudfunctions.net/missy-po-crm-socialWebhookHandler`).
   *   **Token de verificación:** El token privado que definiste (ej: `missy_po_meta_verify_token_2026`).
4. Haz clic en **Verificar y Guardar**. (Meta enviará un GET de prueba para validar el webhook).
5. Suscríbete a los siguientes campos de Instagram:
   *   `comments` (para capturar comentarios en tus posts).
   *   `messages` (para capturar DMs).

### Paso 1.4: Configurar los Secrets en Firebase
Ejecuta los siguientes comandos en tu terminal local para guardar los tokens de forma segura en Firebase:
```bash
firebase functions:secrets:set META_VERIFY_TOKEN="tu_token_de_verificacion_configurado"
firebase functions:secrets:set META_APP_SECRET="tu_app_secret_de_meta"
firebase functions:secrets:set META_PAGE_ACCESS_TOKEN="tu_token_de_acceso_de_pagina"
```

---

## 2. Configuración de YouTube Data API v3

Dado que YouTube no soporta webhooks en tiempo real de manera pública para canales estándar, la Cloud Function `youtubePoll` realiza consultas cada 30 minutos a la API.

### Paso 2.1: Obtener la clave API de Google Cloud
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto o selecciona uno existente.
3. Ve a **API y Servicios** -> **Biblioteca** y busca **YouTube Data API v3**. Haz clic en **Habilitar**.
4. Ve a **API y Servicios** -> **Credenciales**.
5. Haz clic en **Crear credenciales** -> **Clave de API**.
6. Copia la clave de API generada.

### Paso 2.2: Configurar el canal en Firestore
Para que la Cloud Function sepa qué canal monitorear de manera dinámica (sin modificar el código), debes inicializar la configuración en Firestore.

Crea el siguiente documento:
*   **Colección:** `myp_config`
*   **ID del Documento:** `youtube`
*   **Campos:**
    *   `channelId` (String): El ID de tu canal de YouTube (ej: `UCxxxxxxxxxxxxxxxxxxxxxx`).
    *   `lastPolledAt` (Timestamp): Opcional (se auto-actualiza tras cada consulta).

### Paso 2.3: Configurar el Secret en Firebase
Ejecuta el siguiente comando para registrar tu clave API en las Cloud Functions:
```bash
firebase functions:secrets:set YOUTUBE_API_KEY="tu_clave_api_de_google_cloud"
```

---

## 3. Pruebas Locales (Opcional con Ngrok)

Si deseas probar el webhook de Meta antes de desplegarlo en producción:
1. Inicia el emulador de Firebase localmente:
   ```bash
   firebase emulators:start --only functions
   ```
2. Expón el puerto local `5001` de forma pública usando ngrok:
   ```bash
   ngrok http 5001
   ```
3. Copia la URL de ngrok (ej: `https://abcd-123.ngrok-free.app`) y úsala como **URL de retorno** en Meta Developers agregando la ruta de la función:
   `https://abcd-123.ngrok-free.app/missy-po/us-central1/missy-po-crm-socialWebhookHandler`
