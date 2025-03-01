require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const Order = require('../database/models/Order');

/**
 * Script para verificar todos los pedidos y sus números de teléfono
 */
async function checkOrders() {
  try {
    console.log('Verificando todos los pedidos...');
    
    // Conectar a la base de datos
    await connectToDatabase();
    console.log('Conexión a la base de datos establecida');
    
    // Obtener todos los pedidos
    const orders = await Order.find().sort({ created_at: -1 });
    
    console.log(`Se encontraron ${orders.length} pedidos en total`);
    
    // Mostrar información de cada pedido
    orders.forEach((order, index) => {
      console.log(`\nPedido #${index + 1}:`);
      console.log(`- ID: ${order.order_id}`);
      console.log(`- Cliente: ${order.customer.first_name} ${order.customer.last_name}`);
      console.log(`- Teléfono: "${order.customer.phone}" (tipo: ${typeof order.customer.phone})`);
      console.log(`- Estado: ${order.status}`);
      console.log(`- Fecha: ${order.created_at}`);
    });
    
    // Contar pedidos por tipo de teléfono
    const phoneTypes = {};
    orders.forEach(order => {
      const phoneType = typeof order.customer.phone;
      const phoneValue = order.customer.phone;
      const key = `${phoneType}:${phoneValue}`;
      
      if (!phoneTypes[key]) {
        phoneTypes[key] = 1;
      } else {
        phoneTypes[key]++;
      }
    });
    
    console.log('\nResumen de tipos de teléfono:');
    Object.entries(phoneTypes).forEach(([key, count]) => {
      console.log(`- ${key}: ${count} pedidos`);
    });
    
    console.log('\nVerificación completada');
  } catch (error) {
    console.error('Error en la verificación:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    process.exit(0);
  }
}

// Ejecutar la función principal
checkOrders(); 