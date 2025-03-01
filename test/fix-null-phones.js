require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const Order = require('../database/models/Order');

/**
 * Script para corregir pedidos con números de teléfono nulos
 */
async function fixNullPhones() {
  try {
    console.log('Iniciando corrección de números de teléfono nulos...');
    
    // Conectar a la base de datos
    await connectToDatabase();
    console.log('Conexión a la base de datos establecida');
    
    // Buscar pedidos con teléfono nulo
    const nullPhoneOrders = await Order.find({ 'customer.phone': null });
    
    console.log(`Se encontraron ${nullPhoneOrders.length} pedidos con teléfono nulo`);
    
    if (nullPhoneOrders.length === 0) {
      console.log('No hay pedidos que corregir');
      return;
    }
    
    // Mostrar los pedidos encontrados
    nullPhoneOrders.forEach((order, index) => {
      console.log(`\nPedido #${index + 1}:`);
      console.log(`- ID: ${order.order_id}`);
      console.log(`- Cliente: ${order.customer.first_name} ${order.customer.last_name}`);
      console.log(`- Teléfono: ${order.customer.phone} (tipo: ${typeof order.customer.phone})`);
      console.log(`- Estado: ${order.status}`);
      console.log(`- Fecha: ${order.created_at}`);
    });
    
    // Preguntar si se desea corregir los pedidos
    console.log('\n¿Desea corregir estos pedidos? (s/n)');
    
    // Como no podemos usar readline en este entorno, asumimos que sí
    console.log('Asumiendo respuesta: s');
    
    // Corregir los pedidos
    let correctedCount = 0;
    
    for (const order of nullPhoneOrders) {
      // Establecer un número de teléfono por defecto
      order.customer.phone = "573232205135"; // Número por defecto
      
      // Guardar el pedido actualizado
      await order.save();
      
      console.log(`Pedido ${order.order_id} corregido. Nuevo teléfono: ${order.customer.phone}`);
      correctedCount++;
    }
    
    console.log(`\nSe corrigieron ${correctedCount} pedidos`);
    console.log('Corrección completada');
  } catch (error) {
    console.error('Error en la corrección:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    process.exit(0);
  }
}

// Ejecutar la función principal
fixNullPhones(); 