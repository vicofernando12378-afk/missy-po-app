# Plan de Implementación: Checkout y Pasarelas de Pago (Fase 4)

Este plan detalla los pasos para implementar el flujo completo de compra de la tienda de mascotas Missy & Po: diseño de la página de Carrito completo, formulario de Checkout, integración de pasarelas de pago (Mercado Pago, Culqi QR para Yape/Plin, y Pago contra entrega), guardado seguro de órdenes en Firestore (`myp_pedidos`) y reducción transaccional del stock de productos.

---

## 1. Análisis de la App / Requerimiento Actual

- **Proyecto:** Tienda de mascotas Missy & Po.
- **Estado:** Catálogo e imágenes en la nube de Storage y caché de Zustand/IndexedDB operativas en HomePage y StorePage.
- **Objetivo:** Permitir que los clientes compren productos reales, elijan un método de pago y completen el flujo transaccional.

### Stack de Conexión y Datos

| Capa | Componente / Tecnología | Propósito |
|---|---|---|
| Frontend | React Router v6 | Enrutamiento de `/carrito`, `/checkout` y `/orden-confirmada` |
| Estado | Zustand (`cartStore`, `catalogStore`) | Sincronización del carrito de compras y stock local |
| Base de Datos | Cloud Firestore | Colección `myp_pedidos` y actualización de `myp_productos` |
| Seguridad | Firestore Transaction | Validación de stock y decremento atómico |

---

## 2. ¿Por qué hacer este cambio? / Beneficios

| Problema Actual | Solución Propuesta | Beneficios |
|---|---|---|
| Páginas de Carrito y Checkout son placeholders | Implementar vistas completas e interactivas | Permite la conversión de visitantes en ventas reales. |
| El stock de productos no disminuye al comprar | Transacción atómica en Firestore al procesar orden | Evita vender productos agotados por compras simultáneas (overselling). |
| Métodos de pago sin lógica | Integración de MP (mock/SDK), Culqi QR y Pago contra entrega | Diversidad de opciones de pago locales para el cliente. |

---

## 3. Arquitectura Propuesta (File Tree)

```
c:\MIS PROYECTOS\missy-po\
├── src/
│   ├── App.jsx                        # [MODIFY] Agregar rutas de checkout y confirmación
│   ├── services/
│   │   └── firestore.js               # [MODIFY] Agregar función transaccional de creación de pedidos
│   ├── pages/
│   │   ├── CartPage.jsx               # [MODIFY] Implementar vista de carrito detallado
│   │   ├── CheckoutPage.jsx           # [NEW] Formulario de envío y selección de pago
│   │   └── OrderConfirmationPage.jsx  # [NEW] Pantalla de éxito con resumen y link a WhatsApp
│   └── components/
│       └── checkout/
-------------
│           ├── PaymentMpBrick.jsx     # [NEW] Simulación premium del formulario de tarjeta
│           └── PaymentQrCulqi.jsx     # [NEW] Modal interactivo de Yape/Plin con uploader de captura
```

---

## 4. User Review Required (Alertas Críticas)

> [!CAUTION]
> **COMPRAS SIMULTÁNEAS Y CONTROL DE STOCK:**
> Es crítico usar una transacción de Firestore (`runTransaction`) para actualizar el stock. Si dos clientes intentan comprar la última unidad de un producto al mismo tiempo, el sistema cancelará la segunda transacción informando que el producto se agotó en el intermedio, garantizando la consistencia de inventario.

> [!IMPORTANT]
> **ENVÍO DE SUMARIO A WHATSAPP:**
> Al completar el pedido se creará un enlace dinámico hacia WhatsApp para que el cliente envíe su resumen al número de Missy & Po con un solo clic. Esto asegura que, en métodos como Yape/Plin o Contra entrega, el administrador reciba el comprobante de inmediato.

---

## 5. Open Questions

> [!IMPORTANT]
> Por favor responde a las siguientes preguntas técnicas antes de proceder a la ejecución:

1. **Credenciales y Modo de Prueba:** ¿Usamos credenciales sandbox (modo prueba) simuladas para Mercado Pago y Culqi QR, o prefieres ingresar claves públicas reales en el archivo `.env` desde ahora?
2. **Costo de Envío (Delivery):** ¿El costo de envío es gratis, tiene una tarifa plana (ej. S/ 10.00 para todo Lima), o variará según el distrito seleccionado?
3. **Tipo de Comprobante:** ¿Habilitamos la opción de elegir entre **Boleta de Venta** (requiere DNI) y **Factura** (requiere RUC/Razón Social), o emitimos Boleta para todas las compras por defecto?
4. **Distritos de Despacho:** ¿Restringimos las opciones de envío a distritos específicos de Lima Metropolitana en un dropdown, o dejamos un campo de texto abierto para la dirección?

---

## 6. Fases de Implementación (Proposed Changes)

### Fase 1: Implementación de la Vista de Carrito Detallado (`CartPage`)
1. Reemplazar [CartPage.jsx](file:///c:/MIS%20PROYECTOS/missy-po/src/pages/CartPage.jsx) con un diseño responsive premium.
2. Permitir manipulación de cantidades, eliminación de ítems y aplicación de cupones con actualización automática del subtotal y descuento.

### Fase 2: Lógica Transaccional de Pedidos (`firestore.js`)
1. Implementar la función `crearPedidoConTransaccion(datosPedido)` en [firestore.js](file:///c:/MIS%20PROYECTOS/missy-po/src/services/firestore.js).
2. Para cada producto en el pedido:
   - Leer el documento de `myp_productos`.
   - Verificar si el stock disponible es suficiente.
   - Restar la cantidad comprada y actualizar el documento de producto.
3. Escribir el nuevo documento en la colección `myp_pedidos` con estado inicial `pendiente` y detalles del pago.

### Fase 3: Formulario de Checkout e Integración de Pagos (`CheckoutPage`)
1. Crear [CheckoutPage.jsx](file:///c:/MIS%20PROYECTOS/missy-po/src/pages/CheckoutPage.jsx).
2. Implementar los campos de contacto y dirección.
3. Añadir el selector de métodos de pago:
   - **Pago contra entrega**: Flujo inmediato de finalización.
   - **Yape / Plin (Culqi QR)**: Modal interactivo con código QR e instrucciones para subir la captura de la transferencia.
   - **Mercado Pago**: Formulario premium de tarjetas con validación instantánea y procesamiento simulado (sandbox).

### Fase 4: Confirmación y Enrutamiento (`OrderConfirmationPage`)
1. Crear la vista [OrderConfirmationPage.jsx](file:///c:/MIS%20PROYECTOS/missy-po/src/pages/OrderConfirmationPage.jsx) para mostrar el ID del pedido y detalles de contacto.
2. Generar el botón de envío directo a WhatsApp pre-llenado con los datos de la compra.
3. Registrar las nuevas rutas en [App.jsx](file:///c:/MIS%20PROYECTOS/missy-po/src/App.jsx).
