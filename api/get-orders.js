// Endpoint específico para obtener todos los pedidos
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
    
    // Obtener todos los pedidos
    const orders = await orderService.getAllOrders();
    
    // Establecer el tipo de contenido explícitamente
    res.setHeader('Content-Type', 'application/json');
    
    // Enviar la respuesta
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    return res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
}; 