const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { sendTextMessage } = require('../utils/whatsapp-api');
const { connectToDatabase } = require('../database/connection');

module.exports = async (req, res) => {
  // Verificar método
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Configurar CORS si es necesario
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    // Conectar a la base de datos
    await connectToDatabase();
    
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
};