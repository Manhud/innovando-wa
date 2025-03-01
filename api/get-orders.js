// Endpoint específico para obtener todos los pedidos
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');

module.exports = async (req, res) => {
  try {
    // Conectar a la base de datos
    await connectToDatabase();
    
    // Obtener todos los pedidos
    const orders = await orderService.getAllOrders();
    
    // Enviar la respuesta
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
}; 