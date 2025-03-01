require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');

/**
 * Script para probar la actualización del estado de un pedido a CONFIRMADO o CANCELADO
 * Uso: node test/test-update-status.js <order_id> <status>
 * Ejemplo: node test/test-update-status.js ORD-123456789 CONFIRMADO
 */
async function testUpdateStatus() {
  try {
    console.log('Iniciando prueba de actualización de estado de pedido...');
    
    // Conectar a la base de datos
    await connectToDatabase();
    console.log('Conexión a la base de datos establecida');
    
    // Obtener el ID del pedido y el estado de los argumentos de la línea de comandos
    const orderId = process.argv[2];
    const newStatus = process.argv[3];
    
    if (!orderId || !newStatus) {
      console.error('Error: Debe proporcionar un ID de pedido y un estado como argumentos');
      console.log('Uso: node test/test-update-status.js <order_id> <status>');
      console.log('Estados disponibles: CONFIRMADO, CANCELADO, MODIFICACION_SOLICITADA, CAMBIO_DIRECCION_SOLICITADO');
      return;
    }
    
    // Validar el estado
    const validStatuses = ['CONFIRMADO', 'CANCELADO', 'MODIFICACION_SOLICITADA', 'CAMBIO_DIRECCION_SOLICITADO'];
    if (!validStatuses.includes(newStatus)) {
      console.error(`Error: El estado "${newStatus}" no es válido`);
      console.log('Estados válidos:', validStatuses.join(', '));
      return;
    }
    
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
        updated_by: 'test-update-status',
        update_time: new Date()
      }
    });
    
    console.log('Pedido actualizado:');
    console.log(`- ID: ${updatedOrder.order_id}`);
    console.log(`- Estado nuevo: ${updatedOrder.status}`);
    console.log(`- Actualizado: ${updatedOrder.updated_at}`);
    
    console.log('\nPrueba completada con éxito');
    console.log('\nPara verificar el cambio en la interfaz HTML:');
    console.log('1. Inicie el servidor: npm run dev');
    console.log('2. Abra en su navegador: http://localhost:3000/public/views/orders.html');
    console.log('3. Verifique que el pedido aparece con el estado correcto');
  } catch (error) {
    console.error('Error en la prueba de actualización de estado:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    process.exit(0);
  }
}

// Ejecutar la prueba
testUpdateStatus(); 