const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { sendTextMessage } = require('../utils/whatsapp-api');
const { connectToDatabase } = require('../database/connection');

module.exports = async (req, res) => {
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

    console.log('Verificación de button-response recibida:', { mode, token: token ? '***' : undefined, challenge });

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('Button-response webhook verificado!');
      return res.status(200).send(challenge);
    }
    
    console.error('Verificación de button-response fallida: token inválido o modo incorrecto');
    return res.status(403).end();
  }

  // Manejar solicitudes POST
  if (req.method === 'POST') {
    try {
      // Conectar a la base de datos
      await connectToDatabase();
      
      // Verificar si es una respuesta directa de WhatsApp
      if (req.body.entry && req.body.entry[0] && req.body.entry[0].changes && 
          req.body.entry[0].changes[0] && req.body.entry[0].changes[0].value && 
          req.body.entry[0].changes[0].value.messages && 
          req.body.entry[0].changes[0].value.messages.length > 0) {
        
        const message = req.body.entry[0].changes[0].value.messages[0];
        const from = message.from; // Número del cliente
        
        console.log('Mensaje recibido de WhatsApp:', from);
        
        // Procesar según el tipo de mensaje
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
          const buttonValue = message.interactive.button_reply.id;
          const phone = from;
          
          // Procesar la respuesta del botón
          let responseMessage = "";
          
          if (buttonValue === "confirm") {
            responseMessage = "¡Gracias por confirmar tu pedido! Pronto recibirás información sobre el envío.";
          } else if (buttonValue === "cancel") {
            responseMessage = "Lamentamos que hayas cancelado tu pedido. ¿Podemos ayudarte con algo más?";
          } else if (buttonValue === "change") {
            responseMessage = "Para modificar tu pedido, por favor contáctanos directamente al número de atención al cliente.";
          } else {
            responseMessage = "Hemos recibido tu respuesta. Gracias por contactarnos.";
          }
          
          // Enviar mensaje de respuesta
          await sendTextMessage(phone, responseMessage);
          
          return res.status(200).json({ success: true, message: "Respuesta enviada correctamente" });
        }
        
        // Si no es un mensaje interactivo, simplemente confirmar recepción
        return res.status(200).json({ success: true, message: "Mensaje recibido" });
      }
      
      // Si es una solicitud directa con value y phone
      const { value, phone } = req.body;
      
      if (!value || !phone) {
        return res.status(400).json({ error: "Faltan parámetros requeridos (value, phone)" });
      }
      
      let responseMessage = "";
      
      if (value === "confirm") {
        responseMessage = "¡Gracias por confirmar tu pedido! Pronto recibirás información sobre el envío.";
      } else if (value === "cancel") {
        responseMessage = "Lamentamos que hayas cancelado tu pedido. ¿Podemos ayudarte con algo más?";
      } else if (value === "change") {
        responseMessage = "Para modificar tu pedido, por favor contáctanos directamente al número de atención al cliente.";
      } else {
        responseMessage = "Hemos recibido tu respuesta. Gracias por contactarnos.";
      }
      
      // Enviar mensaje de respuesta
      await sendTextMessage(phone, responseMessage);
      
      return res.status(200).json({ success: true, message: "Respuesta enviada correctamente" });
    } catch (error) {
      console.error("Error en la respuesta del botón:", error);
      return res.status(500).json({ error: "Error en el servidor." });
    }
  }

  // Si el método no es GET, POST u OPTIONS
  return res.status(405).json({ error: "Método no permitido" });
};