// Punto de entrada específico para Vercel
require('dotenv').config();
const app = require('./index');

// Asegurarse de que la base de datos esté conectada
const { connectToDatabase } = require('./database/connection');
connectToDatabase().catch(err => {
  console.error('Error al conectar a la base de datos:', err);
});

// Exportar la aplicación Express para Vercel
module.exports = app; 