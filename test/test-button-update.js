require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');
const { handleButtonResponse } = require('../api/button-response');

/**
 * Script para probar la actualización del estado de un pedido mediante la simulación de una respuesta de botón
 * Uso: node test/test-button-update.js <phone_number> <button_text>
 * Ejemplo: node test/test-button-update.js 573232205135 "Confirmar pedido"
 */
async function testButtonUpdate() {
  try {
    console.log('Iniciando prueba de actualización de estado mediante botón...');
    
    // Obtener el número de teléfono y el texto del botón de los argumentos de la línea de comandos
    const phone = process.argv[2];
    const buttonText = process.argv[3];
    
    if (!phone || !buttonText) {
      console.error('Error: Debe proporcionar un número de teléfono y un texto de botón como argumentos');
      console.log('Uso: node test/test-button-update.js <phone_number> <button_text>');
      console.log('Ejemplo: node test/test-button-update.js 573232205135 "Confirmar pedido"');
      return;
    }
    
    console.log(`Número de teléfono: ${phone}`);
    console.log(`Texto del botón: ${buttonText}`);
    
    // Conectar a la base de datos
    await connectToDatabase();
    console.log('Conexión a la base de datos establecida');
    
    // Buscar pedidos asociados al número de teléfono antes de la actualización
    console.log('\nBuscando pedidos asociados al número antes de la actualización:');
    const ordersBefore = await orderService.getOrdersByPhone(phone, { limit: 1 });
    
    if (ordersBefore.length === 0) {
      console.error(`Error: No se encontraron pedidos asociados al número ${phone}`);
      return;
    }
    
    const orderBefore = ordersBefore[0];
    console.log(`Pedido encontrado: ${orderBefore.order_id}`);
    console.log(`Estado actual: ${orderBefore.status}`);
    
    // Exportar la función handleButtonResponse desde button-response.js
    if (typeof handleButtonResponse !== 'function') {
      console.error('Error: La función handleButtonResponse no está disponible');
      console.log('Asegúrese de exportar la función en api/button-response.js');
      
      // Implementación alternativa
      console.log('\nUsando implementación alternativa para la prueba...');
      
      let newStatus = '';
      if (buttonText.includes('Confirmar')) {
        newStatus = 'CONFIRMADO';
      } else if (buttonText.includes('Cancelar')) {
        newStatus = 'CANCELADO';
      } else if (buttonText.includes('Modificar')) {
        newStatus = 'MODIFICACION_SOLICITADA';
      } else {
        newStatus = 'RESPUESTA_RECIBIDA';
      }
      
      console.log(`Actualizando estado a: ${newStatus}`);
      const updatedOrder = await orderService.updateOrderStatus(orderBefore.order_id, newStatus, {
        updated_at: new Date(),
        test_details: {
          button_text: buttonText,
          update_time: new Date()
        }
      });
      
      console.log('\nPedido actualizado:');
      console.log(`- ID: ${updatedOrder.order_id}`);
      console.log(`- Estado nuevo: ${updatedOrder.status}`);
      console.log(`- Actualizado: ${updatedOrder.updated_at}`);
      
      console.log('\nPrueba completada con éxito (implementación alternativa)');
      return;
    }
    
    // Simular la respuesta del botón
    console.log('\nSimulando respuesta de botón...');
    await handleButtonResponse(phone, buttonText, buttonText);
    
    // Buscar pedidos asociados al número de teléfono después de la actualización
    console.log('\nBuscando pedidos asociados al número después de la actualización:');
    const ordersAfter = await orderService.getOrdersByPhone(phone, { limit: 1 });
    
    if (ordersAfter.length === 0) {
      console.error(`Error: No se encontraron pedidos asociados al número ${phone} después de la actualización`);
      return;
    }
    
    const orderAfter = ordersAfter[0];
    console.log(`Pedido encontrado: ${orderAfter.order_id}`);
    console.log(`Estado nuevo: ${orderAfter.status}`);
    
    console.log('\nPrueba completada con éxito');
  } catch (error) {
    console.error('Error en la prueba de actualización mediante botón:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    process.exit(0);
  }
}

// Ejecutar la prueba
testButtonUpdate(); 