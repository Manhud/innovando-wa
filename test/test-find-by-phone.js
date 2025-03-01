require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');

/**
 * Script para probar la búsqueda de pedidos por número de teléfono
 */
async function testFindByPhone() {
  try {
    console.log('Iniciando prueba de búsqueda de pedidos por teléfono...');
    
    // Conectar a la base de datos
    await connectToDatabase();
    console.log('Conexión a la base de datos establecida');
    
    // Obtener el número de teléfono de los argumentos de la línea de comandos
    const phone = process.argv[2];
    if (!phone) {
      console.error('Error: Debe proporcionar un número de teléfono como argumento');
      console.log('Uso: node test/test-find-by-phone.js <phone_number> [limit]');
      return;
    }
    
    // Obtener el límite de resultados de los argumentos de la línea de comandos o usar 5 por defecto
    const limit = parseInt(process.argv[3]) || 5;
    
    // Buscar pedidos por número de teléfono
    console.log(`Buscando pedidos para el teléfono: ${phone} (límite: ${limit})`);
    const orders = await orderService.getOrdersByPhone(phone, { limit });
    
    if (orders.length === 0) {
      console.log(`No se encontraron pedidos para el teléfono ${phone}`);
      return;
    }
    
    console.log(`Se encontraron ${orders.length} pedidos:`);
    orders.forEach((order, index) => {
      console.log(`\nPedido #${index + 1}:`);
      console.log(`- ID: ${order.order_id}`);
      console.log(`- Cliente: ${order.customer?.first_name} ${order.customer?.last_name}`);
      console.log(`- Teléfono: ${order.customer?.phone}`);
      console.log(`- Estado: ${order.status}`);
      console.log(`- Fecha: ${order.created_at}`);
      
      // Mostrar productos si están disponibles
      if (order.line_items && order.line_items.length > 0) {
        console.log('- Productos:');
        order.line_items.forEach(item => {
          console.log(`  * ${item.quantity}x ${item.name} - $${item.price}`);
        });
      }
      
      // Mostrar dirección de envío si está disponible
      if (order.shipping_address) {
        console.log('- Dirección de envío:');
        console.log(`  * ${order.shipping_address.address1}`);
        console.log(`  * ${order.shipping_address.city}, ${order.shipping_address.province}`);
      }
    });
    
    console.log('\nPrueba completada con éxito');
  } catch (error) {
    console.error('Error en la prueba de búsqueda por teléfono:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    process.exit(0);
  }
}

// Ejecutar la prueba
testFindByPhone(); 