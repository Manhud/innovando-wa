require('dotenv').config();
const mongoose = require('mongoose');

console.log('Intentando conectar a MongoDB...');
console.log(`URL de conexión: ${process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('¡Conexión exitosa a MongoDB Atlas!');
    console.log('La base de datos está configurada correctamente.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB Atlas:');
    console.error(err);
    process.exit(1);
  }); 