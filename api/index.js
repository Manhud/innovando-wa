// Este archivo es específico para Vercel Serverless Functions
const app = require('../index');

// Endpoint para la ruta principal
const { connectToDatabase } = require('../database/connection');

module.exports = async (req, res) => {
  try {
    // Conectar a la base de datos (opcional)
    await connectToDatabase();
    
    // Establecer el tipo de contenido
    res.setHeader('Content-Type', 'text/html');
    
    // Enviar la respuesta HTML
    res.status(200).send('Servidor funcionando correctamente. <a href="/orders">Ver pedidos</a>');
  } catch (error) {
    console.error('Error en la ruta principal:', error);
    res.status(500).send('Error en el servidor');
  }
}; 