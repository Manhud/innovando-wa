require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');
const Order = require('../database/models/Order');

/**
 * Script para depurar la búsqueda de pedidos por número de teléfono
 * Prueba múltiples formatos y muestra información detallada
 * 
 * Uso: node test/test-phone-debug.js <phone_number>
 * Ejemplo: node test/test-phone-debug.js 573232205135
 */
async function testPhoneDebug() {
  try {
    console.log('Iniciando depuración de búsqueda por teléfono...');
    
    // Obtener el número de teléfono de los argumentos de la línea de comandos
    const phone = process.argv[2];
    
    if (!phone) {
      console.error('Error: Debe proporcionar un número de teléfono como argumento');
      console.log('Uso: node test/test-phone-debug.js <phone_number>');
      console.log('Ejemplo: node test/test-phone-debug.js 573232205135');
      return;
    }
    
    console.log(`Número de teléfono a buscar: ${phone}`);
    
    // Conectar a la base de datos
    await connectToDatabase();
    console.log('Conexión a la base de datos establecida');
    
    // Generar variantes del número de teléfono para probar
    const phoneVariants = generatePhoneVariants(phone);
    console.log('Variantes del número de teléfono a probar:');
    phoneVariants.forEach((variant, index) => {
      console.log(`${index + 1}. ${variant}`);
    });
    
    // Buscar usando el servicio normal
    console.log('\n1. BÚSQUEDA CON orderService.getOrdersByPhone:');
    const orders = await orderService.getOrdersByPhone(phone, { limit: 10 });
    logOrderResults(orders, phone);
    
    // Buscar directamente con cada variante
    console.log('\n2. BÚSQUEDA DIRECTA CON CADA VARIANTE:');
    for (const variant of phoneVariants) {
      console.log(`\nProbando variante: ${variant}`);
      
      // Búsqueda exacta
      console.log('- Búsqueda exacta:');
      const exactOrders = await Order.find({ 'customer.phone': variant }).limit(5);
      logOrderResults(exactOrders, variant);
      
      // Búsqueda con regex
      console.log('- Búsqueda con regex:');
      const regexOrders = await Order.find({ 'customer.phone': { $regex: variant } }).limit(5);
      logOrderResults(regexOrders, variant);
    }
    
    // Mostrar todos los pedidos en la base de datos (limitado a 10)
    console.log('\n3. LISTADO DE TODOS LOS PEDIDOS EN LA BASE DE DATOS:');
    const allOrders = await Order.find().limit(10);
    console.log(`Se encontraron ${allOrders.length} pedidos en total`);
    
    allOrders.forEach((order, index) => {
      console.log(`\nPedido #${index + 1}:`);
      console.log(`- ID: ${order.order_id}`);
      console.log(`- Cliente: ${order.customer.first_name} ${order.customer.last_name}`);
      console.log(`- Teléfono: "${order.customer.phone}"`);
      console.log(`- Email: ${order.customer.email}`);
      console.log(`- Estado: ${order.status}`);
      console.log(`- Fecha: ${order.created_at}`);
    });
    
    console.log('\nDepuración completada');
  } catch (error) {
    console.error('Error en la depuración:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    process.exit(0);
  }
}

/**
 * Genera variantes del número de teléfono para probar diferentes formatos
 * @param {string} phone - Número de teléfono original
 * @returns {string[]} - Array con variantes del número
 */
function generatePhoneVariants(phone) {
  const variants = [phone]; // Formato original
  
  // Eliminar todos los caracteres no numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  if (!variants.includes(cleanPhone)) variants.push(cleanPhone);
  
  // Con y sin prefijo de país
  if (cleanPhone.startsWith('57')) {
    const withoutPrefix = cleanPhone.substring(2);
    if (!variants.includes(withoutPrefix)) variants.push(withoutPrefix);
  } else {
    const withPrefix = `57${cleanPhone}`;
    if (!variants.includes(withPrefix)) variants.push(withPrefix);
  }
  
  // Con formato +57
  const plusPrefix = `+57${cleanPhone.startsWith('57') ? cleanPhone.substring(2) : cleanPhone}`;
  if (!variants.includes(plusPrefix)) variants.push(plusPrefix);
  
  // Últimos 10 dígitos
  if (cleanPhone.length > 10) {
    const last10 = cleanPhone.slice(-10);
    if (!variants.includes(last10)) variants.push(last10);
  }
  
  return variants;
}

/**
 * Muestra información sobre los pedidos encontrados
 * @param {Array} orders - Lista de pedidos
 * @param {string} searchTerm - Término de búsqueda utilizado
 */
function logOrderResults(orders, searchTerm) {
  if (orders.length === 0) {
    console.log(`  No se encontraron pedidos para "${searchTerm}"`);
    return;
  }
  
  console.log(`  Se encontraron ${orders.length} pedidos para "${searchTerm}":`);
  orders.forEach((order, index) => {
    console.log(`  ${index + 1}. ID: ${order.order_id}, Cliente: ${order.customer.first_name}, Teléfono: "${order.customer.phone}", Estado: ${order.status}`);
  });
}

// Ejecutar la función principal
testPhoneDebug(); 