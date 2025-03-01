require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');

/**
 * Script para probar la actualización del estado de un pedido usando un número de teléfono
 * Uso: node test/test-update-by-phone.js <phone_number> <new_status>
 * Ejemplo: node test/test-update-by-phone.js 573232205135 CONFIRMADO
 */
async function testUpdateByPhone() {
  try {
    console.log('Iniciando prueba de actualización de estado por teléfono...');
    
    // Obtener el número de teléfono y el nuevo estado de los argumentos de la línea de comandos
    const phone = process.argv[2];
    const newStatus = process.argv[3];
    
    if (!phone || !newStatus) {
      console.error('Error: Debe proporcionar un número de teléfono y un nuevo estado como argumentos');
      console.log('Uso: node test/test-update-by-phone.js <phone_number> <new_status>');
      console.log('Ejemplo: node test/test-update-by-phone.js 573232205135 CONFIRMADO');
      console.log('Estados disponibles: CREATED, MESSAGE_SENT, MESSAGE_FAILED, CONFIRMADO, CANCELADO, MODIFICACION_SOLICITADA, CAMBIO_DIRECCION_SOLICITADO, RESPUESTA_RECIBIDA');
      return;
    }
    
    console.log(`Número de teléfono: ${phone}`);
    console.log(`Nuevo estado: ${newStatus}`);
    
    // Conectar a la base de datos
    await connectToDatabase();
    console.log('Conexión a la base de datos establecida');
    
    // Buscar pedidos asociados al número de teléfono
    console.log('\nBuscando pedidos asociados al número:');
    const orders = await orderService.getOrdersByPhone(phone, { limit: 1 });
    
    if (orders.length === 0) {
      console.error(`Error: No se encontraron pedidos asociados al número ${phone}`);
      return;
    }
    
    const order = orders[0];
    console.log(`Pedido encontrado: ${order.order_id}`);
    console.log(`Estado actual: ${order.status}`);
    
    // Actualizar el estado del pedido
    console.log(`\nActualizando estado a: ${newStatus}`);
    const updatedOrder = await orderService.updateOrderStatus(order.order_id, newStatus, {
      updated_at: new Date(),
      test_details: {
        update_method: 'test-update-by-phone',
        update_time: new Date()
      }
    });
    
    console.log('\nPedido actualizado:');
    console.log(`- ID: ${updatedOrder.order_id}`);
    console.log(`- Estado nuevo: ${updatedOrder.status}`);
    console.log(`- Actualizado: ${updatedOrder.updated_at}`);
    
    console.log('\nPrueba completada con éxito');
  } catch (error) {
    console.error('Error en la prueba de actualización por teléfono:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    process.exit(0);
  }
}

// Ejecutar la prueba
testUpdateByPhone(); 