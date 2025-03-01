require('dotenv').config();
const { connectToDatabase, closeDatabaseConnection } = require('./connection');
const mongoose = require('mongoose');

/**
 * Script para inicializar la base de datos
 */
async function initDatabase() {
  try {
    console.log('Iniciando la configuración de la base de datos...');
    
    // Conectar a la base de datos
    await connectToDatabase();
    
    // Verificar la conexión
    console.log('Estado de la conexión:', mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado');
    
    // Crear índices y otras configuraciones si es necesario
    console.log('Base de datos inicializada correctamente');
    
    // Cerrar la conexión
    await closeDatabaseConnection();
    
    console.log('Proceso de inicialización completado');
    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar la función de inicialización
initDatabase(); 