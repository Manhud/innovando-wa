require('dotenv').config();
const { connectToDatabase, closeDatabaseConnection } = require('./connection');
const mongoose = require('mongoose');

/**
 * Script para probar la conexión a MongoDB Atlas
 */
async function testConnection() {
  try {
    console.log('Iniciando prueba de conexión a MongoDB Atlas...');
    console.log('URI de conexión:', process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));
    
    // Conectar a la base de datos
    await connectToDatabase();
    
    // Verificar la conexión
    const connectionState = mongoose.connection.readyState;
    console.log('Estado de la conexión:', 
      connectionState === 0 ? 'Desconectado' :
      connectionState === 1 ? 'Conectado' :
      connectionState === 2 ? 'Conectando' :
      connectionState === 3 ? 'Desconectando' : 'Desconocido'
    );
    
    if (connectionState === 1) {
      console.log('¡Conexión exitosa a MongoDB Atlas!');
      
      // Obtener información del servidor
      const admin = mongoose.connection.db.admin();
      const serverInfo = await admin.serverInfo();
      console.log('Versión de MongoDB:', serverInfo.version);
      
      // Listar las bases de datos disponibles
      const dbs = await admin.listDatabases();
      console.log('Bases de datos disponibles:');
      dbs.databases.forEach(db => {
        console.log(`- ${db.name} (${Math.round(db.sizeOnDisk / 1024 / 1024 * 100) / 100} MB)`);
      });
    }
    
    // Cerrar la conexión
    await closeDatabaseConnection();
    
    console.log('Prueba de conexión completada');
    process.exit(0);
  } catch (error) {
    console.error('Error al probar la conexión a MongoDB Atlas:', error);
    process.exit(1);
  }
}

// Ejecutar la función de prueba
testConnection(); 