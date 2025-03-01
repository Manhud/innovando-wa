const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { sendTextMessage } = require('../utils/whatsapp-api');
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');

module.exports = async (req, res) => {
  // Siempre responder con 200 OK para evitar que Meta reintente constantemente
  // Esto es una práctica recomendada para webhooks de WhatsApp
  const respondSuccess = () => res.status(200).json({ status: 'ok' });

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Manejar solicitudes GET (verificación del webhook)
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
    if (data.object === 'whatsapp_business_account' && 
        data.entry && 
        data.entry.length > 0 && 
        data.entry[0].changes && 
        data.entry[0].changes.length > 0) {
      
      const change = data.entry[0].changes[0];
      
      if (change.value && change.value.messages && change.value.messages.length > 0) {
        const message = change.value.messages[0];
        const from = message.from; // Número del cliente
        
        console.log('Mensaje recibido de:', from);
        console.log('Tipo de mensaje:', message.type);
        
        // Manejar respuesta de botón interactivo
        if (message.type === 'interactive') {
          console.log('Mensaje interactivo:', JSON.stringify(message.interactive));
          
          if (message.interactive.type === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;
            const buttonText = message.interactive.button_reply.title;
            console.log(`Botón presionado: ID=${buttonId}, Texto=${buttonText}`);
            
            await handleButtonResponse(from, buttonId, buttonText);
          } else if (message.interactive.type === 'list_reply') {
            const listId = message.interactive.list_reply.id;
            const listTitle = message.interactive.list_reply.title;
            console.log(`Lista seleccionada: ID=${listId}, Título=${listTitle}`);
            
            await handleButtonResponse(from, listId, listTitle);
          }
        }
        // Manejar el formato de botón directo
        else if (message.type === 'button') {
          const buttonText = message.button.text;
          console.log(`Botón directo presionado: ${buttonText}`);
          
          await handleButtonResponse(from, buttonText, buttonText);
        }
        // Otros tipos de mensajes
        else {
          console.log(`Tipo de mensaje no procesable: ${message.type}`);
        }
      } else {
        console.log('No hay mensajes en la notificación');
      }
    } 
    // Manejar formato alternativo de respuesta de botón
    else if (data.type === 'button' && data.from) {
      const from = data.from;
      const buttonText = data.button.text || data.button.payload;
      console.log('Botón presionado (formato alternativo):', buttonText);
      
      await handleButtonResponse(from, buttonText, buttonText);
    } 
    // Manejar formato directo con value y phone (para compatibilidad con versiones anteriores)
    else if (data.value && data.phone) {
      console.log(`Solicitud directa recibida: value=${data.value}, phone=${data.phone}`);
      
      await handleButtonResponse(data.phone, data.value, data.value);
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
};

/**
 * Maneja las respuestas de botones y envía mensajes personalizados
 * @param {string} from - Número de teléfono del remitente
 * @param {string} buttonId - ID del botón presionado
 * @param {string} buttonText - Texto del botón presionado
 */
async function handleButtonResponse(from, buttonId, buttonText) {
  try {
    console.log(`Procesando respuesta de botón: ID="${buttonId}", Texto="${buttonText}" para el número ${from}`);
    
    // Conectar a la base de datos para actualizar el estado del pedido si es necesario
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Error al conectar con la base de datos:', dbError);
      // Continuamos aunque falle la conexión a la BD
    }
    
    let responseMessage = "";
    let newStatus = "";
    
    // Responder según el botón presionado (por ID o texto)
    if (buttonId === 'confirm' || buttonText === 'Confirmar' || buttonText === 'Confirmar pedido') {
      responseMessage = "¡Gracias por confirmar tu pedido! 🎉\n\n" +
        "Tu pedido ha sido registrado y será procesado inmediatamente.\n" +
        "Te mantendremos informado sobre el estado de tu envío. 📦\n\n" +
        "*¡Gracias por confiar en INNOVANDO!* 😊";
      newStatus = "CONFIRMADO";
    } 
    else if (buttonId === 'change' || buttonText === 'Modificar' || buttonText === 'Modificar pedido') {
      responseMessage = "Entendido, vamos a modificar tu pedido. 📝\n\n" +
        "Por favor, indícanos qué cambios deseas realizar:\n" +
        "- Cantidad\n" +
        "- Producto\n" +
        "- Otro\n\n" +
        "Un asesor te atenderá en breve. 👨‍💼\n\n" +
        "*¡Gracias por confiar en INNOVANDO!* 😊";
      newStatus = "MODIFICACION_SOLICITADA";
    } 
    else if (buttonText === 'Modificar datos de envío') {
      responseMessage = "Vamos a actualizar tus datos de envío. 🏠\n\n" +
        "Por favor, envíanos:\n" +
        "1. Dirección completa\n" +
        "2. Ciudad\n" +
        "3. Nombre del destinatario\n" +
        "4. Teléfono de contacto\n\n" +
        "Un asesor procesará los cambios pronto. ✅\n\n" +
        "*¡Gracias por confiar en INNOVANDO!* 😊";
      newStatus = "CAMBIO_DIRECCION_SOLICITADO";
    }
    else if (buttonId === 'cancel' || buttonText === 'Cancelar' || buttonText === 'Cancelar pedido') {
      responseMessage = "Lamentamos que hayas cancelado tu pedido. 😔\n\n" +
        "Si deseas realizar un nuevo pedido o tienes alguna pregunta, no dudes en contactarnos.\n\n" +
        "*¡Gracias por confiar en INNOVANDO!* 😊";
      newStatus = "CANCELADO";
    } 
    else {
      responseMessage = "Hemos recibido tu respuesta. Gracias por contactarnos.\n\n" +
        "*¡Gracias por confiar en INNOVANDO!* 😊";
      newStatus = "RESPUESTA_RECIBIDA";
      console.log(`Botón no reconocido específicamente: "${buttonText}" (ID: ${buttonId})`);
    }
    
    // Enviar mensaje de respuesta
    console.log(`Enviando respuesta a ${from}: ${responseMessage}`);
    await sendTextMessage(from, responseMessage);
    console.log('Respuesta enviada correctamente');
    
    // Si tenemos un estado nuevo y el sistema está conectado a la base de datos,
    // intentamos actualizar el pedido asociado al número de teléfono
    if (newStatus) {
      try {
        // Buscar pedidos asociados al número de teléfono
        const orders = await orderService.getOrdersByPhone(from, { limit: 1 });
        
        if (orders && orders.length > 0) {
          const latestOrder = orders[0]; // Obtener el pedido más reciente
          
          // Actualizar el estado del pedido
          await orderService.updateOrderStatus(latestOrder.order_id, newStatus, {
            updated_at: new Date(),
            response_details: {
              button_id: buttonId,
              button_text: buttonText,
              response_time: new Date()
            }
          });
          
          console.log(`Pedido ${latestOrder.order_id} actualizado a estado: ${newStatus}`);
        } else {
          console.log(`No se encontraron pedidos asociados al número ${from}`);
        }
      } catch (updateError) {
        console.error('Error al actualizar el estado del pedido:', updateError);
      }
    }
    
    console.log('Respuesta de botón procesada exitosamente');
  } catch (error) {
    console.error(`Error al manejar la respuesta del botón "${buttonText}":`, error);
    // No propagamos el error para evitar que falle todo el webhook
  }
}