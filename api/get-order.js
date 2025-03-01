// Endpoint específico para obtener un pedido por ID
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');

module.exports = async (req, res) => {
  try {
    // Conectar a la base de datos
    await connectToDatabase();
    
    // Obtener el ID del pedido de la URL
    const orderId = req.query.orderId;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Se requiere el ID del pedido' });
    }
    
    // Obtener el pedido
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // Enviar la respuesta
    res.status(200).json(order);
  } catch (error) {
    console.error('Error al obtener el pedido:', error);
    res.status(500).json({ error: 'Error al obtener el pedido' });
  }
}; 