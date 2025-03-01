/**
 * Script para corregir los números de teléfono nulos en los pedidos existentes
 * 
 * Ejecutar con: npm run fix-null-phones
 */

require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const Order = require('../database/models/Order');

async function fixNullPhoneNumbers() {
  try {
    console.log('Conectando a la base de datos...');
    await connectToDatabase();
    
    console.log('Buscando pedidos con números de teléfono nulos...');
    const ordersWithNullPhone = await Order.find({
      'customer.phone': null
    });
    
    console.log(`Se encontraron ${ordersWithNullPhone.length} pedidos con números de teléfono nulos.`);
    
    if (ordersWithNullPhone.length === 0) {
      console.log('No hay pedidos que corregir.');
      process.exit(0);
    }
    
    console.log('Corrigiendo números de teléfono nulos...');
    
    const defaultPhone = '573232205135';
    let updatedCount = 0;
    
    for (const order of ordersWithNullPhone) {
      console.log(`Corrigiendo pedido ${order.order_id}...`);
      
      // Buscar el número de teléfono en otras partes del pedido
      let phoneFound = false;
      
      // Verificar si hay información de envío con teléfono
      if (order.shipping_address && order.shipping_address.phone) {
        order.customer.phone = order.shipping_address.phone.replace(/\D/g, '');
        if (!order.customer.phone.startsWith('57') && order.customer.phone.length >= 10) {
          order.customer.phone = '57' + order.customer.phone;
        }
        console.log(`  Usando teléfono de shipping_address: ${order.customer.phone}`);
        phoneFound = true;
      }
      
      // Si no se encontró, usar el número por defecto
      if (!phoneFound) {
        order.customer.phone = defaultPhone;
        console.log(`  Asignando número por defecto: ${defaultPhone}`);
      }
      
      // Guardar el pedido actualizado
      await order.save();
      
      updatedCount++;
      console.log(`  Pedido ${order.order_id} actualizado correctamente.`);
    }
    
    console.log(`Se actualizaron ${updatedCount} pedidos correctamente.`);
    console.log('Proceso completado.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error al corregir los números de teléfono:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
fixNullPhoneNumbers(); 