require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');

/**
 * Script para probar la actualización del estado de un pedido
 */
async function testOrderStatus() {
  try {
    console.log('Iniciando prueba de actualización de estado de pedido...');
    
    // Conectar a la base de datos
    await connectToDatabase();
    console.log('Conexión a la base de datos establecida');
    
    // Obtener el ID del pedido de los argumentos de la línea de comandos
    const orderId = process.argv[2];
    if (!orderId) {
      console.error('Error: Debe proporcionar un ID de pedido como argumento');
      console.log('Uso: node test/test-order-status.js <order_id> [status]');
      return;
    }
    
    // Obtener el estado del pedido de los argumentos de la línea de comandos o usar CONFIRMADO por defecto
    const newStatus = process.argv[3] || 'CONFIRMADO';
    
    // Buscar el pedido por ID
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      console.error(`Error: No se encontró un pedido con ID ${orderId}`);
      return;
    }
    
    console.log('Pedido encontrado:');
    console.log(`- ID: ${order.order_id}`);
    console.log(`- Cliente: ${order.customer?.first_name} ${order.customer?.last_name}`);
    console.log(`- Teléfono: ${order.customer?.phone}`);
    console.log(`- Estado actual: ${order.status}`);
    
    // Actualizar el estado del pedido
    console.log(`Actualizando estado a: ${newStatus}`);
    const updatedOrder = await orderService.updateOrderStatus(orderId, newStatus, {
      updated_at: new Date(),
      test_details: {
        updated_by: 'test-script',
        update_time: new Date()
      }
    });
    
    console.log('Pedido actualizado:');
    console.log(`- ID: ${updatedOrder.order_id}`);
    console.log(`- Estado nuevo: ${updatedOrder.status}`);
    console.log(`- Actualizado: ${updatedOrder.updated_at}`);
    
    console.log('Prueba completada con éxito');
  } catch (error) {
    console.error('Error en la prueba de actualización de estado:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    process.exit(0);
  }
}

// Ejecutar la prueba
testOrderStatus(); 