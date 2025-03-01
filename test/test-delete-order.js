require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');

/**
 * Script para probar la eliminación de un pedido
 * Uso: node test/test-delete-order.js <order_id>
 * Ejemplo: node test/test-delete-order.js ORD-1234567890
 */
async function testDeleteOrder() {
  try {
    console.log('Iniciando prueba de eliminación de pedido...');
    
    // Obtener el ID del pedido de los argumentos de la línea de comandos
    const orderId = process.argv[2];
    
    if (!orderId) {
      console.error('Error: Debe proporcionar un ID de pedido como argumento');
      console.log('Uso: node test/test-delete-order.js <order_id>');
      console.log('Ejemplo: node test/test-delete-order.js ORD-1234567890');
      return;
    }
    
    console.log(`ID del pedido a eliminar: ${orderId}`);
    
    // Conectar a la base de datos
    await connectToDatabase();
    console.log('Conexión a la base de datos establecida');
    
    // Buscar el pedido antes de eliminarlo
    console.log('\nBuscando pedido...');
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      console.error(`Error: No se encontró el pedido con ID ${orderId}`);
      return;
    }
    
    console.log('Pedido encontrado:');
    console.log(`- ID: ${order.order_id}`);
    console.log(`- Cliente: ${order.customer.first_name} ${order.customer.last_name}`);
    console.log(`- Teléfono: ${order.customer.phone}`);
    console.log(`- Estado: ${order.status}`);
    console.log(`- Fecha de creación: ${order.created_at}`);
    
    // Confirmar eliminación
    console.log('\n⚠️ ADVERTENCIA: Esta operación eliminará permanentemente el pedido de la base de datos ⚠️');
    console.log('Presione Ctrl+C para cancelar o espere 5 segundos para continuar...');
    
    // Esperar 5 segundos antes de eliminar
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Eliminar el pedido
    console.log('\nEliminando pedido...');
    const result = await orderService.deleteOrder(orderId);
    
    console.log('\nResultado de la eliminación:');
    console.log(`- Éxito: ${result.success}`);
    console.log(`- Mensaje: ${result.message}`);
    
    console.log('\nVerificando que el pedido ya no existe...');
    const checkOrder = await orderService.getOrderById(orderId);
    
    if (!checkOrder) {
      console.log('✅ Confirmado: El pedido ha sido eliminado correctamente');
    } else {
      console.error('❌ Error: El pedido sigue existiendo en la base de datos');
    }
    
    console.log('\nPrueba completada');
  } catch (error) {
    console.error('Error en la prueba de eliminación:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    process.exit(0);
  }
}

// Ejecutar la prueba
testDeleteOrder(); 