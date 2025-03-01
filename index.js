require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const webhookHandler = require('./api/webhook');
const buttonResponseHandler = require('./api/button-response');
const { connectToDatabase } = require('./database/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.post('/api/webhook', webhookHandler);
app.post('/api/button-response', buttonResponseHandler);

// Ruta para verificar el estado de los pedidos
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const orderService = require('./database/services/orderService');
    const order = await orderService.getOrderById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    return res.status(200).json(order);
  } catch (error) {
    console.error('Error al obtener el pedido:', error);
    return res.status(500).json({ error: 'Error al obtener el pedido' });
  }
});

// Ruta para listar todos los pedidos
app.get('/api/orders', async (req, res) => {
  try {
    const orderService = require('./database/services/orderService');
    const orders = await orderService.getAllOrders();
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    return res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
});

// Ruta para la página de gestión de pedidos
app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views/orders.html'));
});

// Ruta de verificación
app.get('/', (req, res) => {
  res.status(200).send('Servidor funcionando correctamente. <a href="/orders">Ver pedidos</a>');
});

// Conectar a la base de datos
connectToDatabase().catch(err => {
  console.error('Error al conectar a la base de datos:', err);
});

// Para entornos de desarrollo local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`Gestión de pedidos disponible en http://localhost:${PORT}/orders`);
  });
}

// Exportar la aplicación para Vercel
module.exports = app;

// Exportar una función de handler para Vercel
module.exports.handler = async (req, res) => {
  // Asegurarse de que la base de datos esté conectada
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
  
  // Manejar la solicitud con Express
  return app(req, res);
}; 