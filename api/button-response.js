import { sendTextMessage } from '../utils/whatsapp-api';

export default async function handler(req, res) {

   if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('Button webhook verificado!');
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Button handler recibido:', JSON.stringify(req.body, null, 2));
    
    const data = req.body;
    
    // Verificar si hay mensajes en la solicitud
    if (data.entry && 
        data.entry[0].changes && 
        data.entry[0].changes[0].value.messages && 
        data.entry[0].changes[0].value.messages.length > 0) {
      
      const message = data.entry[0].changes[0].value.messages[0];
      const from = message.from; // Número del cliente
      
      console.log('Mensaje recibido de:', from);
      console.log('Tipo de mensaje:', message.type);
      
      // Verificar si es una interacción con botón
      if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
        const buttonText = message.interactive.button_reply.title;
        
        console.log('Botón presionado:', buttonText);
        
        // Responder según el botón presionado
        if (buttonText === 'Confirmar pedido') {
          await sendTextMessage(
            from, 
            "¡Gracias por confirmar tu pedido! 🎉\n\n" +
            "Tu pedido ha sido registrado y será procesado inmediatamente.\n" +
            "Te mantendremos informado sobre el estado de tu envío. 📦\n\n" +
            "¿Necesitas algo más? Estamos aquí para ayudarte. 😊"
          );
        } 
        else if (buttonText === 'Modificar pedido') {
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
        }
      }
    }
    
    // Siempre responder con 200 OK
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error procesando botones:', error);
    return res.status(200).json({ status: 'error', message: error.message });
  }
}