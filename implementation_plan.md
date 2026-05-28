# Plan de Implementación: Migración de Imágenes a Firebase Storage y Actualización de Catálogo

Este plan describe la estrategia para subir las imágenes locales de WooCommerce (carpetas `2022` y `2023` bajo `uploads/`) al bucket de Firebase Storage recién configurado y actualizar el catálogo en Firestore (`myp_productos`) con las URLs públicas de descarga de las imágenes correspondientes.

---

## 1. Análisis de la App / Requerimiento Actual

- **Proyecto:** Tienda de mascotas Missy & Po.
- **Estado:** Firebase Storage está ahora activo e inicializado bajo el bucket `missypoweb.firebasestorage.app`.
- **Objetivo:** Migrar todas las imágenes físicas del catálogo a Storage y tener la base de datos apuntando a la nube en lugar de rutas locales.

### Stack de Conexión y Datos

| Capa | Componente | Descripción / Prefijo |
|---|---|---|
| Almacenamiento | Firebase Storage | Bucket `gs://missypoweb.firebasestorage.app` en plan Blaze |
| Base de Datos | Cloud Firestore | Colección `myp_productos` |
| Imágenes locales | Carpeta `uploads/` | Directorio local con carpetas `2022/` y `2023/` |

---

## 2. ¿Por qué hacer este cambio? / Beneficios

| Problema Actual | Solución Propuesta | Beneficios |
|---|---|---|
| Catálogo con imágenes apuntando a rutas relativas locales (`/uploads/...`) | Re-ejecutar migración con Storage inicializado | Las imágenes se servirán de forma global y segura en la nube (producción). |
| Acceso de escritura bloqueado en Firebase por reglas de seguridad | Relajación temporal de reglas para la migración | Permite al script de Node (sin autenticación de usuario) realizar la importación masiva. |

---

## 3. Arquitectura Propuesta (File Tree)

No crearemos archivos nuevos; utilizaremos los scripts y archivos de configuración existentes de la Fase 2:

```
c:\MIS PROYECTOS\missy-po\
├── firestore.rules          # [MODIFY] Modificar temporalmente para abrir escritura y luego restaurar
├── storage.rules            # [MODIFY] Modificar temporalmente para abrir escritura y luego restaurar
└── scripts/
    └── migrate-wp-to-firestore.js  # [RUN] Ejecutar el script para realizar la migración completa a la nube
```

---

## 4. User Review Required (Alertas Críticas)

> [!WARNING]
> **APERTURA TEMPORAL DE REGLAS DE SEGURIDAD:** 
> Dado que el script de migración se ejecuta localmente en Node.js mediante el SDK de Firebase Web sin autenticación de usuario, se generará un error de `PERMISSION_DENIED` si intentamos escribir en Firestore/Storage con las reglas actuales de administrador.
> 
> Habilitaremos temporalmente la lectura y escritura para cualquiera (`allow read, write: if true;`) durante la ejecución de la migración y la volveremos a bloquear con las reglas restrictivas de producción de inmediato al finalizar. El proyecto está vacío y en desarrollo, por lo que el riesgo de intrusión durante esos segundos es nulo.

> [!IMPORTANT]
> **CONSUMO DE CUOTA EN EL PLAN BLAZE:** 
> La subida de imágenes a Firebase Storage consumirá transferencia de datos y almacenamiento. Para los 41 productos activos, esto tomará unos megabytes y se mantendrá dentro del tramo gratuito diario que ofrece el plan Blaze (5 GB de almacenamiento, 1 GB de descarga diario sin costo).

---

## 5. Open Questions

> [!IMPORTANT]
> Por favor responde a las siguientes preguntas técnicas antes de que proceda a ejecutar la migración:

1. **Autorización de Reglas Temporales:** ¿Confirmas que podemos proceder a relajar temporalmente las reglas de escritura de Firestore y Storage, ejecutar el script, y restaurarlas inmediatamente después de la importación?
2. **Existencia de las Imágenes:** ¿Las imágenes correspondientes a los años 2022 y 2023 se encuentran físicamente en tu directorio local `C:\MIS PROYECTOS\missy-po\uploads`? (Si falta alguna imagen, el script guardará un placeholder estándar en Firestore).
3. **Copia de seguridad local (Opcional):** ¿Deseas que hagamos una copia local de toda la carpeta `uploads/` dentro de `public/` en la aplicación React por si acaso, o preferimos delegar el 100% de la carga de imágenes a Firebase Storage?

---

## 6. Fases de Implementación (Proposed Changes)

### Fase 1: Apertura Temporal de Reglas
1. Modificar [firestore.rules](file:///c:/MIS%20PROYECTOS/missy-po/firestore.rules) permitiendo escritura libre en `myp_productos`.
2. Modificar [storage.rules](file:///c:/MIS%20PROYECTOS/missy-po/storage.rules) permitiendo escritura libre en `myp`.
3. Desplegar reglas relajadas:
   ```bash
   npx firebase deploy --only firestore:rules,storage
   ```

### Fase 2: Ejecución de la Migración
1. Correr el script de migración:
   ```bash
   node scripts/migrate-wp-to-firestore.js
   ```
2. Verificar en la consola de Firebase que las carpetas `myp/productos/...` se llenen con las imágenes correctas y que la colección de Firestore tenga URLs que inicien con `https://firebasestorage.googleapis.com/...`.

### Fase 3: Restauración y Bloqueo de Reglas de Seguridad
1. Revertir [firestore.rules](file:///c:/MIS%20PROYECTOS/missy-po/firestore.rules) a su estado original (solo escritura para `admin == true`).
2. Revertir [storage.rules](file:///c:/MIS%20PROYECTOS/missy-po/storage.rules) a su estado original.
3. Desplegar las reglas seguras de producción:
   ```bash
   npx firebase deploy --only firestore:rules,storage
   ```
