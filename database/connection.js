const mongoose = require('mongoose');

/**
 * Establece la conexión con la base de datos MongoDB
 * @returns {Promise<mongoose.Connection>} Conexión a MongoDB
 */
async function connectToDatabase() {
  try {
    // Usar la URI de MongoDB desde las variables de entorno
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('La variable de entorno MONGODB_URI no está definida');
    }
    
    // Opciones de conexión para MongoDB Atlas
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout de selección de servidor
      socketTimeoutMS: 45000, // Tiempo de espera para operaciones de socket
      family: 4 // Usar IPv4, omitir para permitir IPv6
    };
    
    // Conectar a MongoDB
    await mongoose.connect(uri, options);
    
    // Configurar eventos de conexión
    mongoose.connection.on('connected', () => {
      console.log('Mongoose conectado a MongoDB Atlas');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Error de conexión de Mongoose:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose desconectado de MongoDB Atlas');
    });
    
    // Manejar cierre de la aplicación
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexión a MongoDB cerrada por terminación de la aplicación');
      process.exit(0);
    });
    
    console.log('Conexión a MongoDB Atlas establecida correctamente');
    return mongoose.connection;
  } catch (error) {
    console.error('Error al conectar a MongoDB Atlas:', error);
    throw error;
  }
}

/**
 * Cierra la conexión con la base de datos
 * @returns {Promise<void>}
 */
async function closeDatabaseConnection() {
  try {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada correctamente');
  } catch (error) {
    console.error('Error al cerrar la conexión a MongoDB:', error);
    throw error;
  }
}

module.exports = {
  connectToDatabase,
  closeDatabaseConnection,
  connection: mongoose.connection
}; 