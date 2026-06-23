# Walkthrough: Integración de Checkout, Métodos de Pago y Transacciones de Stock

Hemos completado exitosamente la **Fase 4** del proyecto. La aplicación de Missy & Po ahora cuenta con un flujo completo de compra totalmente integrado con Firebase, control transaccional de stock para evitar sobreventas, y pasarelas de pago interactivas (Mercado Pago, Yape/Plin con subida de recibos a la nube, y Pago contra entrega).

---

## 🌟 Lo que hemos logrado

### 1. Página de Carrito Detallada (`CartPage.jsx`)
- Reemplazamos el placeholder del carrito por una pantalla responsiva de alto rendimiento.
- El usuario puede gestionar cantidades, eliminar productos, y aplicar o quitar cupones en tiempo real.
- Calcula el subtotal y descuenta los porcentajes del cupón directamente desde el estado global de Zustand.

### 2. Formulario de Checkout Inteligente (`CheckoutPage.jsx`)
- Implementamos el formulario con validación estricta de campos obligatorios, formatos de correo, y número de dígitos para documentos de identidad.
- **Envío Dinámico Calculado:**
  - **Arequipa:** Si el subtotal es mayor o igual a S/ 30, el costo de envío es **Gratis**. De lo contrario, se cobra una tarifa plana de S/ 10.
  - **Nacional:** Si el subtotal es mayor o igual a S/ 100, el costo de envío es **Gratis**. De lo contrario, se cobra S/ 15.
  - La lógica consulta primero un documento de configuración en Firestore (`myp_config/shipping`) para permitir al administrador cambiar estos valores desde su panel en el futuro.
- **Comprobación Fiscal (Boleta de Venta):**
  - Permite al cliente marcar si desea emitir su boleta "Con Impuesto" o "Sin Impuesto".
  - Si es "Con Impuesto", desglosa el **IGV (18%)** y la Base Imponible matemáticamente en base al total acumulado, manteniéndolo visible en el resumen del pedido.
  - Solicita DNI (8 dígitos) o RUC (11 dígitos) dinámicamente según el tipo de contribuyente.

### 3. Pasarelas de Pago Interactivas (Simuladores Premium)
- **Yape / Plin (`PaymentQrCulqi.jsx`):**
  - Genera dinámicamente un código QR de cobro utilizando la API de QR Server codificado con el monto exacto del total del pedido en Soles.
  - Ofrece una interfaz intuitiva para arrastrar o subir la captura de pantalla del pago.
  - **Subida a Storage:** Al confirmar, el script sube físicamente el recibo (imagen) al bucket de Firebase Storage en la ruta `myp/comprobantes/${orderId}_recibo.jpg` y asocia el enlace permanente al pedido en Firestore.
- **Mercado Pago (`PaymentMpBrick.jsx`):**
  - Imita el diseño visual oficial de Mercado Pago Checkout Bricks.
  - **Tarjeta 3D Interactiva:** Integra una tarjeta de crédito virtual en 3D que gira mediante transiciones CSS al enfocar el campo del código CVV.
  - Detecta marcas de tarjeta de forma dinámica (Visa, Mastercard, AMEX o Diners) según los dígitos iniciales.

### 4. Transacción Atómica de Stock (`firestore.js`)
- Escribimos la función `crearPedidoConTransaccion` que asegura el inventario:
  - En un bloque de transacción de Firestore, lee cada producto de la orden.
  - Si hay stock suficiente, descuenta el stock directamente (a nivel de producto simple o de su respectiva variación seleccionada).
  - Si falta stock en algún ítem, cancela la operación y lanza una alerta legible en el checkout para que el cliente ajuste su cantidad.
  - Registra el pedido en la colección `myp_pedidos`.

### 5. Página de Éxito y Boleta Térmica (`OrderConfirmationPage.jsx`)
- Muestra los detalles completos del pedido procesado.
- **Formateo para Impresión:** Integra estilos CSS `@media print` en `index.css`. Al hacer clic en "Imprimir / Guardar PDF", oculta la navegación, botones e interfaces flotantes (clase `.no-print`), dejando únicamente el ticket de compra en un formato limpio listo para ser impreso o guardado como PDF en tamaño A4 o ticketera.
- **Botón de WhatsApp Inteligente:** Genera un enlace que abre un chat pre-llenado con el formato estructurado del pedido para que el cliente comparta su comprobante en un solo clic.

---

## 📊 Flujo Probado y Verificado

1. **Selección:** Agregamos una variante "TALLA: M" del producto "Arnés Lou" al carrito.
2. **Cálculo:** Seleccionamos departamento "Arequipa" y distrito "Cayma". El subtotal superó los S/ 30, por lo que el envío marcó S/ 0.00 (Gratis).
3. **Comprobación:** Seleccionamos DNI y marcamos "Con Impuesto". Calculó correctamente la base imponible y el 18% del IGV.
4. **Pago:** Seleccionamos Yape, subimos una imagen de prueba y escribimos el número de operación.
5. **Creación:** Se ejecutó la transacción de Firestore, descontó el stock de la variante correspondiente, subió la captura a Storage y guardó el pedido.
6. **Redirección:** La confirmación levantó la boleta, habilitó la impresión a PDF y el link estructurado de WhatsApp.
7. **Compilación:** HMR y Vite estables sin ninguna advertencia de compilación.
