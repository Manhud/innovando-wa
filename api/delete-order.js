const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');

/**
 * Endpoint para eliminar un pedido de la base de datos
 * Método: DELETE
 * Parámetros: orderId - ID del pedido a eliminar
 */
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar que el método sea DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido. Use DELETE.' });
  }

  try {
    // Obtener el ID del pedido de los parámetros de la solicitud
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Se requiere el ID del pedido (orderId)' });
    }
    
    console.log(`Solicitud para eliminar el pedido: ${orderId}`);
    
    // Conectar a la base de datos
    await connectToDatabase();
    
    // Verificar que el pedido existe
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: `Pedido con ID ${orderId} no encontrado` });
    }
    
    // Guardar información del pedido para el registro
    const orderInfo = {
      id: order.order_id,
      customer: {
        name: `${order.customer.first_name} ${order.customer.last_name}`,
        phone: order.customer.phone
      },
      status: order.status,
      created_at: order.created_at
    };
    
    // Eliminar el pedido
    const result = await orderService.deleteOrder(orderId);
    
    // Registrar la eliminación
    console.log(`Pedido ${orderId} eliminado correctamente`);
    console.log('Información del pedido eliminado:', JSON.stringify(orderInfo));
    
    // Responder con éxito
    return res.status(200).json({
      success: true,
      message: `Pedido ${orderId} eliminado correctamente`,
      deletedOrder: orderInfo
    });
  } catch (error) {
    console.error('Error al eliminar el pedido:', error);
    return res.status(500).json({ error: `Error al eliminar el pedido: ${error.message}` });
  }
}; 