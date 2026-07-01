# Plan de Implementación: Rediseño del Módulo de Reclamos

## 📋 Objetivo del Rediseño
Transformar el flujo actual de gestión de reclamos en el panel de administración (`missypoweb.web.app/admin/reclamaciones`). Se eliminará la edición directa de estados mediante selectores planos en la lista principal para implementar un sistema basado en **Modales Resolutivos de Detalle**, **Trazabilidad de Acciones (Logs)** e **Inyección Automatizada de Plantillas de Correo** en la colección `myp_correos`.

---

## 1. Modificaciones en la Interfaz Principal (Vista de Lista)
* **Filtros Superiores:** Mantener las pestañas de navegación intactas (`Todos`, `Recibidos`, `En Revisión`, `Respondidos`, `Cerrados`).
* **Simplificación Operativa:** Eliminar por completo el componente desplegable (`Select`) de cambio de estado ubicado a la derecha de cada tarjeta de reclamo.
* **Interactividad:** Convertir toda la tarjeta del reclamo en un elemento completamente interactivo (`Clickable`). Al hacer clic en cualquier parte de la fila/tarjeta, se debe disparar la apertura de un componente **Modal de Gran Tamaño (LG Modal)**.

---

## 2. Actualización de la Arquitectura de Datos (Firestore Schema)
Cada vez que el administrador ejecute una acción de resolución dentro del modal, el documento del reclamo correspondiente en Firestore debe actualizarse inyectando o modificando un mapa estructurado de auditoría interna:

```json
{
  "status": "Respondido", // o "Cerrado" según corresponda
  "resolution": {
    "type": "devolucion", // Opciones: "devolucion" | "cambio" | "otro"
    "adminNotes": "Texto complementario ingresado por el administrador",
    "resolvedAt": "SERVER_TIMESTAMP",
    "updatedBy": "admin_auth_uid"
  }
}
```

---

## 3. Diseño y Comportamiento del Modal Resolutivo
El modal utilizará una distribución de dos columnas con un esquema visual de proporción **60/40**:

### Columna Izquierda (60%): Bloque de Información General
* **Bloque de Identificación:** Renderizar de forma destacada el ID del Reclamo (`REC-XXXX`), la fecha exacta de ingreso y la información de contacto del cliente (Nombre, Email y Celular con un botón de enlace directo a la API de WhatsApp).
* **Bloque Comercial:** Detallar el nombre del producto afectado y el monto total de la transacción (`S/ .XX.XX`).
* **Cuerpo del Reclamo:** Espacio de lectura limpia para el mensaje descriptivo redactado por el usuario.
* **Galería de Evidencias:** Grid adaptativo que muestre las miniaturas de las imágenes adjuntadas por el cliente. Al hacer clic en cualquier miniatura, se abrirá un visor de imágenes (Lightbox/Modal) a pantalla completa.

### Columna Derecha (40%): Panel de Control Operativo
Un contenedor con fondo diferenciado titulado **"Procesar Resolución"** que contendrá un selector exclusivo (Radio Cards o Pestañas Verticales) con tres flujos automatizados:

#### Opción A: Devolución Aceptada
* **UI/UX:** Muestra un aviso informativo: *"Se enviará un correo electrónico al cliente indicando que se procederá con el reembolso de su dinero previa entrega del producto al repartidor en la visita coordinada."*
* **Gatillo:** Botón de acción `[Confirmar y Procesar Reembolso]`.
* **Impacto en Base de Datos:** Cambia el `status` del reclamo a `"Respondido"`, escribe el mapa de resolución y crea de forma automática un nuevo documento en la colección `myp_correos` con la siguiente estructura:
  ```json
  {
    "to": "correo_del_cliente@gmail.com",
    "message": {
      "subject": "Actualización de tu Reclamo N° [ID_RECLAMO] - Devolución Aceptada",
      "html": "<h1>Hola [NOMBRE_CLIENTE]</h1><p>Hemos procesado tu reclamo sobre el producto <strong>[PRODUCTO]</strong>. Te informamos que tu solicitud de devolución ha sido <strong>Aceptada</strong>.</p><p>Nuestro equipo se pondrá en contacto contigo vía telefónica a la brevedad para acordar el día, hora y la forma de entrega del producto afectado a nuestro repartidor, así como los detalles para realizar el reembolso de tu dinero.</p><p>Atentamente,<br>El equipo de Missy & Po</p>"
    }
  }
  ```

#### Opción B: Cambio de Producto
* **UI/UX:** Muestra un aviso informativo: *"Se enviará un correo notificando al cliente que un asesor lo contactará directamente a su teléfono celular para coordinar la logística del cambio de producto."*
* **Gatillo:** Botón de acción `[Confirmar y Coordinar Cambio]`.
* **Impacto en Base de Datos:** Cambia el `status` del reclamo a `"Respondido"`, escribe el mapa de resolución e inyecta en `myp_correos`:
  ```json
  {
    "to": "correo_del_cliente@gmail.com",
    "message": {
      "subject": "Actualización de tu Reclamo N° [ID_RECLAMO] - Cambio de Producto",
      "html": "<h1>Hola [NOMBRE_CLIENTE]</h1><p>Hemos evaluado tu caso respecto al producto <strong>[PRODUCTO]</strong> and hemos aprobado un <strong>Cambio de Producto</strong>.</p><p>En las próximas horas, un asesor de nuestra tienda se comunicará directamente contigo a tu número celular para coordinar la entrega de tu nuevo producto y el retiro del artículo afectado.</p><p>Atentamente,<br>El equipo de Missy & Po</p>"
    }
  }
  ```

#### Opción C: Otro (Respuesta Personalizada)
* **UI/UX:** Habilita dinámicamente un campo de texto multilínea (`TextArea`) de carácter obligatorio bajo el título **"Respuesta Formal al Cliente"** con un placeholder que diga *"Escriba aquí los fundamentos técnicos o la solución alternativa basada en las evidencias..."*.
* **Gatillo:** Botón de acción `[Enviar Respuesta Personalizada]`.
* **Impacto en Base de Datos:** Cambia el `status` del reclamo a `"Respondido"`, guarda el texto en `resolution.adminNotes` e introduce en `myp_correos`:
  ```json
  {
    "to": "correo_del_cliente@gmail.com",
    "message": {
      "subject": "Resolución de tu Reclamo N° [ID_RECLAMO]",
      "html": "<h1>Hola [NOMBRE_CLIENTE]</h1><p>Te escribimos para dar respuesta al reclamo ingresado el día [FECHA] respecto al producto [PRODUCTO].</p><div style='padding: 15px; background-color: #f9f9f9; border-left: 4px solid #ccc;'><p>[TEXTO_INGRESADO_POR_EL_ADMINISTRADOR]</p></div><p>Si tienes alguna duda adicional, puedes responder directamente a este correo.</p><p>Atentamente,<br>Dirección de Soporte Missy & Po</p>"
    }
  }
  ```

---

## 4. Requerimientos Técnicos y de Control (Entorno Antigravity)
* **Asincronía Segura:** Los botones de acción deben mutar a un estado deshabilitado mostrando un indicador de carga (`Loading Spinner`) mientras la promesa de Firestore se resuelve.
* **Control de Cierre:** Al completarse la transacción correctamente, el modal debe cerrarse de manera automática.
* **Feedback al Usuario:** Disparar un componente de notificación flotante (`Toast Alert`) con el mensaje: *"Resolución procesada y correo enviado con éxito"*.
* **Estilos:** Mantener la coherencia estética de la línea de diseño del panel de Missy & Po utilizando los tokens del framework UI del proyecto.