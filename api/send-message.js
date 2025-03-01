const { sendTextMessage } = require('../utils/whatsapp-api');
const chatService = require('../database/services/chatService');
const orderService = require('../database/services/orderService');

/**
 * Manejador para enviar mensajes desde la interfaz de administración
 */
module.exports = async (req, res) => {
  // Permitir CORS para desarrollo local
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    const { orderId, message, phone } = req.body;
    
    // Validar los datos de entrada
    if (!orderId || !message || !phone) {
      return res.status(400).json({ 
        error: 'Datos incompletos', 
        details: 'Se requiere orderId, message y phone' 
      });
    }
    
    console.log(`Enviando mensaje al pedido ${orderId} (${phone}): "${message}"`);
    
    // Verificar que el pedido existe
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ 
        error: 'Pedido no encontrado', 
        details: `No se encontró un pedido con ID ${orderId}` 
      });
    }
    
    // Enviar el mensaje a WhatsApp
    try {
      const response = await sendTextMessage(phone, message);
      
      // Guardar el mensaje en la base de datos
      await chatService.saveMessage({
        order_id: orderId,
        sender: 'ADMIN',
        message,
        phone,
        message_type: 'TEXT',
        created_at: new Date()
      });
      
      // Actualizar el estado de mensajes no leídos del pedido
      if (order.has_unread_messages) {
        await orderService.updateUnreadMessagesStatus(orderId, false);
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Mensaje enviado correctamente',
        details: response
      });
    } catch (whatsappError) {
      console.error('Error al enviar mensaje a WhatsApp:', whatsappError);
      
      return res.status(500).json({ 
        error: 'Error al enviar mensaje a WhatsApp', 
        details: whatsappError.message 
      });
    }
  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ 
      error: 'Error en el servidor', 
      details: error.message 
    });
  }
}; 