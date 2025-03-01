// Endpoint específico para la ruta /orders en Vercel
const path = require('path');
const fs = require('fs');
const { connectToDatabase } = require('../database/connection');

// Leer el archivo HTML
const ordersHtmlPath = path.join(process.cwd(), 'public/views/orders.html');
const ordersHtml = fs.readFileSync(ordersHtmlPath, 'utf8');

module.exports = async (req, res) => {
  try {
    // Conectar a la base de datos (opcional, solo si es necesario)
    await connectToDatabase();
    
    // Establecer el tipo de contenido
    res.setHeader('Content-Type', 'text/html');
    
    // Enviar el HTML
    res.status(200).send(ordersHtml);
  } catch (error) {
    console.error('Error al servir la página de órdenes:', error);
    res.status(500).send('Error al cargar la página de órdenes');
  }
}; 