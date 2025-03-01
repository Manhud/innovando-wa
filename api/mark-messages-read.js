const chatService = require('../database/services/chatService');
const orderService = require('../database/services/orderService');

/**
 * Manejador para marcar mensajes como leídos
 * Implementa un patrón de respuesta temprana para evitar timeouts en Vercel
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
    const { orderId } = req.body;
    
    // Validar los datos de entrada
    if (!orderId) {
      return res.status(400).json({ 
        error: 'Datos incompletos', 
        details: 'Se requiere orderId' 
      });
    }
    
    console.log(`Marcando mensajes como leídos para el pedido ${orderId}`);
    
    // Verificar que el pedido existe
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ 
        error: 'Pedido no encontrado', 
        details: `No se encontró un pedido con ID ${orderId}` 
      });
    }
    
    // Responder inmediatamente para evitar timeouts en Vercel
    res.status(202).json({ 
      success: true, 
      message: 'Procesando marcado de mensajes como leídos',
      orderId,
      status: 'processing'
    });
    
    // Continuar el procesamiento en segundo plano
    try {
      // Marcar los mensajes como leídos
      await chatService.markMessagesAsRead(orderId);
      
      // Actualizar el estado de mensajes no leídos del pedido
      await orderService.updateUnreadMessagesStatus(orderId, false);
      
      console.log(`Mensajes del pedido ${orderId} marcados como leídos correctamente`);
    } catch (error) {
      console.error(`Error al marcar mensajes como leídos para el pedido ${orderId}:`, error);
      // No podemos enviar respuesta aquí porque ya respondimos
    }
  } catch (error) {
    console.error('Error en el servidor:', error);
    // Solo enviar respuesta de error si aún no hemos respondido
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Error en el servidor', 
        details: error.message 
      });
    }
  }
}; 