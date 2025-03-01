const { connectToDatabase } = require('../database/connection');
const chatService = require('../database/services/chatService');
const orderService = require('../database/services/orderService');

/**
 * Endpoint para obtener los mensajes de chat de un pedido
 * Método: GET
 * Parámetros: 
 *   - orderId: ID del pedido (opcional)
 *   - phone: Número de teléfono (opcional)
 * 
 * Se debe proporcionar al menos uno de los dos parámetros.
 * Si se proporciona orderId, se devuelven los mensajes de ese pedido.
 * Si se proporciona phone, se devuelven los mensajes de ese número de teléfono.
 * Si se proporcionan ambos, se prioriza orderId.
 */
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar que el método sea GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Use GET.' });
  }

  try {
    // Obtener parámetros de la solicitud
    const { orderId, phone } = req.query;
    
    // Verificar que se proporcione al menos un parámetro
    if (!orderId && !phone) {
      return res.status(400).json({ 
        error: 'Se requiere al menos un parámetro: orderId o phone' 
      });
    }
    
    // Conectar a la base de datos
    await connectToDatabase();
    
    let messages = [];
    let orderInfo = null;
    
    // Si se proporciona orderId, obtener mensajes por ID de pedido
    if (orderId) {
      console.log(`Obteniendo mensajes para el pedido: ${orderId}`);
      
      // Obtener información del pedido
      orderInfo = await orderService.getOrderById(orderId);
      
      if (!orderInfo) {
        return res.status(404).json({ error: `Pedido con ID ${orderId} no encontrado` });
      }
      
      // Obtener mensajes del pedido
      messages = await chatService.getMessagesByOrderId(orderId);
      
      // Marcar mensajes como leídos
      await chatService.markMessagesAsRead(orderId);
    } 
    // Si se proporciona phone, obtener mensajes por número de teléfono
    else if (phone) {
      console.log(`Obteniendo mensajes para el teléfono: ${phone}`);
      
      // Buscar pedidos asociados al número de teléfono
      const orders = await orderService.getOrdersByPhone(phone);
      
      if (orders && orders.length > 0) {
        // Usar el pedido más reciente para mostrar información
        orderInfo = orders[0];
        
        // Obtener mensajes por teléfono
        messages = await chatService.getMessagesByPhone(phone);
      } else {
        return res.status(404).json({ 
          error: `No se encontraron pedidos asociados al teléfono ${phone}` 
        });
      }
    }
    
    // Preparar la respuesta
    const response = {
      success: true,
      order: orderInfo ? {
        id: orderInfo.order_id,
        customer: {
          name: `${orderInfo.customer.first_name} ${orderInfo.customer.last_name}`,
          phone: orderInfo.customer.phone
        },
        status: orderInfo.status,
        created_at: orderInfo.created_at
      } : null,
      messages: messages.map(msg => ({
        id: msg._id,
        order_id: msg.order_id,
        sender: msg.sender,
        message: msg.message,
        message_type: msg.message_type,
        created_at: msg.created_at,
        is_read: msg.is_read
      })),
      count: messages.length
    };
    
    // Responder con los mensajes
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener mensajes de chat:', error);
    return res.status(500).json({ error: `Error al obtener mensajes: ${error.message}` });
  }
}; 