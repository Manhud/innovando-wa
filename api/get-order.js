// Endpoint específico para obtener un pedido por ID
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Verificar que sea una solicitud GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

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
    
    // Establecer el tipo de contenido explícitamente
    res.setHeader('Content-Type', 'application/json');
    
    // Enviar la respuesta
    return res.status(200).json(order);
  } catch (error) {
    console.error('Error al obtener el pedido:', error);
    return res.status(500).json({ error: 'Error al obtener el pedido' });
  }
}; 