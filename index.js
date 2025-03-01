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

// Importar los manejadores de API
const getOrdersHandler = require('./api/get-orders');
const getOrderHandler = require('./api/get-order');
const ordersPageHandler = require('./api/orders');
const deleteOrderHandler = require('./api/delete-order');
const getChatHandler = require('./api/get-chat');
const markMessagesReadHandler = require('./api/mark-messages-read');
const sendMessageHandler = require('./api/send-message');

// Rutas de la API
app.post('/api/webhook', webhookHandler);
app.post('/api/button-response', buttonResponseHandler);
app.post('/api/send-message', sendMessageHandler);
app.post('/api/mark-messages-read', markMessagesReadHandler);

// Nuevas rutas de API
app.get('/api/get-orders', getOrdersHandler);
app.get('/api/get-order', getOrderHandler);
app.get('/orders', ordersPageHandler);
app.delete('/api/delete-order', deleteOrderHandler);
app.get('/api/get-chat', getChatHandler);

// Rutas de compatibilidad para mantener las rutas antiguas funcionando
app.get('/api/orders', getOrdersHandler);
app.get('/api/orders/:orderId', (req, res) => {
  req.query.orderId = req.params.orderId;
  getOrderHandler(req, res);
});

// Ruta para manejar URLs incorrectas con /public/
app.get('/public/*', (req, res) => {
  // Redirigir a la página de redirección
  res.sendFile(path.join(__dirname, 'public', 'redirect.html'));
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