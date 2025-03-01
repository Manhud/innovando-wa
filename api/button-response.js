import { sendTextMessage } from '../utils/whatsapp-api';

export default async function handler(req, res) {
  // Siempre responder con 200 OK para evitar que Meta reintente constantemente
  // Esto es una práctica recomendada para webhooks de WhatsApp
  const respondSuccess = () => res.status(200).json({ status: 'ok' });

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Verificación de webhook recibida:', { mode, token: token ? '***' : undefined, challenge });

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('Button webhook verificado!');
      return res.status(200).send(challenge);
    }
    console.error('Verificación de webhook fallida: token inválido o modo incorrecto');
    return res.status(403).end();
  }

  if (req.method !== 'POST') {
    console.error(`Método no permitido: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Button handler recibido:', JSON.stringify(req.body, null, 2));
    
    const data = req.body;
    
    // Verificar si hay mensajes en la solicitud (formato estándar de webhook)
    if (data.entry && 
        data.entry[0].changes && 
        data.entry[0].changes[0].value.messages && 
        data.entry[0].changes[0].value.messages.length > 0) {
      
      const message = data.entry[0].changes[0].value.messages[0];
      const from = message.from; // Número del cliente
      
      console.log('Mensaje recibido de:', from);
      console.log('Tipo de mensaje:', message.type);
      
      // Manejar respuesta de botón directa (formato antiguo)
      if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
        const buttonText = message.interactive.button_reply.title;
        await handleButtonResponse(from, buttonText);
      }
      // Manejar el nuevo formato de respuesta de botón
      else if (message.type === 'button') {
        const buttonText = message.button.text;
        await handleButtonResponse(from, buttonText);
      }
    } 
    // Manejar formato alternativo de respuesta de botón (como el que mostraste)
    else if (data.type === 'button' && data.from) {
      const from = data.from;
      const buttonText = data.button.text || data.button.payload;
      console.log('Botón presionado (formato alternativo):', buttonText);
      await handleButtonResponse(from, buttonText);
    } else {
      console.log('Formato de mensaje no reconocido o sin mensajes');
    }
    
    // Siempre responder con 200 OK
    return respondSuccess();
  } catch (error) {
    console.error('Error procesando botones:', error);
    // Aún así respondemos con 200 para que Meta no reintente
    return respondSuccess();
  }
}

/**
 * Maneja las respuestas de botones y envía mensajes personalizados
 * @param {string} from - Número de teléfono del remitente
 * @param {string} buttonText - Texto del botón presionado
 */
async function handleButtonResponse(from, buttonText) {
  try {
    console.log(`Procesando respuesta de botón: "${buttonText}" para el número ${from}`);
    
    // Responder según el botón presionado
    if (buttonText === 'Confirmar pedido') {
      console.log('Enviando mensaje de confirmación de pedido');
      await sendTextMessage(
        from, 
        "¡Gracias por confirmar tu pedido! 🎉\n\n" +
        "Tu pedido ha sido registrado y será procesado inmediatamente.\n" +
        "Te mantendremos informado sobre el estado de tu envío. 📦\n\n" +
        "¿Necesitas algo más? Estamos aquí para ayudarte. 😊"
      );
    } 
    else if (buttonText === 'Modificar pedido') {
      console.log('Enviando mensaje de modificación de pedido');
      await sendTextMessage(
        from,
        "Entendido, vamos a modificar tu pedido. 📝\n\n" +
        "Por favor, indícanos qué cambios deseas realizar:\n" +
        "- Cantidad\n" +
        "- Producto\n" +
        "- Otro\n\n" +
        "Un asesor te atenderá en breve. 👨‍💼"
      );
    } 
    else if (buttonText === 'Modificar datos de envío') {
      console.log('Enviando mensaje de modificación de datos de envío');
      await sendTextMessage(
        from,
        "Vamos a actualizar tus datos de envío. 🏠\n\n" +
        "Por favor, envíanos:\n" +
        "1. Dirección completa\n" +
        "2. Ciudad\n" +
        "3. Nombre del destinatario\n" +
        "4. Teléfono de contacto\n\n" +
        "Un asesor procesará los cambios pronto. ✅"
      );
    } else {
      console.log(`Botón no reconocido: "${buttonText}"`);
    }
    console.log('Respuesta de botón procesada exitosamente');
  } catch (error) {
    console.error(`Error al manejar la respuesta del botón "${buttonText}":`, error);
    // No propagamos el error para evitar que falle todo el webhook
  }
}