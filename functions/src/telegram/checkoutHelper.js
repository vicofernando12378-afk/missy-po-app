import axios from 'axios';

/**
 * Sends the appropriate Telegram prompt based on the current checkout step.
 * Uses consistent formatting, emojis, and inline keyboard buttons where applicable.
 */
export async function sendCheckoutPrompt(chatId, checkout, token) {
  const step = checkout.step;
  const datos = checkout.datos || {};

  if (step === 'confirmar_datos') {
    const resumenDatos = [
      `👤 *Nombre:* ${datos.clienteNombre}`,
      `📞 *Teléfono:* ${datos.telefono}`,
      `🪪 *DNI:* ${datos.documentoNumero || 'No registrado'}`,
      `📍 *Dirección:* ${datos.direccion}`,
      `🏢 *Distrito:* ${datos.distrito || '—'}`,
      `🗺️ *Departamento:* ${datos.departamento || '—'}`
    ].join('\n');

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: `✨ *¡Detectamos tus datos registrados en nuestro Club!* ✨\n\n${resumenDatos}\n\n¿Deseas usar esta misma información para el envío de tu pedido?`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Sí, usar estos datos', callback_data: 'checkout_saved:si' }],
          [{ text: '✏️ No, cambiar datos', callback_data: 'checkout_saved:no' }]
        ]
      }
    });
  } else if (step === 'nombre') {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: 'Por favor, responde a este mensaje escribiendo tu *nombre y apellido completo* para el pedido:',
      parse_mode: 'Markdown'
    });
  } else if (step === 'telefono') {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: '¿Cuál es tu *número de celular/teléfono* para coordinar la entrega?',
      parse_mode: 'Markdown'
    });
  } else if (step === 'dni') {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: 'Ingresa tu número de *DNI* (opcional — responde *omitir* si prefieres no darlo):',
      parse_mode: 'Markdown'
    });
  } else if (step === 'direccion') {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: '¿Cuál es tu *dirección de entrega*? (calle, número, departamento y referencia):',
      parse_mode: 'Markdown'
    });
  } else if (step === 'departamento') {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: 'Selecciona tu *Departamento*:',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📍 Arequipa', callback_data: 'checkout_dept:Arequipa' }],
          [{ text: '📍 Lima', callback_data: 'checkout_dept:Lima' }],
          [{ text: '📍 Cusco', callback_data: 'checkout_dept:Cusco' }],
          [{ text: '📍 Otro (escríbelo)', callback_data: 'checkout_dept:otro' }]
        ]
      }
    });
  } else if (step === 'distrito') {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: '¿En qué *distrito* te encuentras?',
      parse_mode: 'Markdown'
    });
  } else if (step === 'pago') {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: '¿Cómo deseas realizar el pago?',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💰 Contra Entrega', callback_data: 'checkout_pago:contra_entrega' }],
          [{ text: '📱 Yape / Plin', callback_data: 'checkout_pago:yape' }]
        ]
      }
    });
  }
}
