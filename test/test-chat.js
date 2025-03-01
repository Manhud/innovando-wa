require('dotenv').config();
const { connectToDatabase } = require('../database/connection');
const chatService = require('../database/services/chatService');
const orderService = require('../database/services/orderService');

/**
 * Script para probar la funcionalidad de chat
 * 
 * Uso: 
 * - Para probar con ID de pedido: node test/test-chat.js order ORD-123456789
 * - Para probar con teléfono: node test/test-chat.js phone 573001234567
 * - Para agregar un mensaje de prueba: node test/test-chat.js add ORD-123456789 "Mensaje de prueba"
 */
async function testChat() {
  try {
    console.log('Iniciando prueba de chat...');
    
    // Obtener argumentos de la línea de comandos
    const action = process.argv[2];
    const param = process.argv[3];
    
    if (!action || !param) {
      console.error('Error: Faltan argumentos');
      console.log('Uso:');
      console.log('- Para probar con ID de pedido: node test/test-chat.js order ORD-123456789');
      console.log('- Para probar con teléfono: node test/test-chat.js phone 573001234567');
      console.log('- Para agregar un mensaje de prueba: node test/test-chat.js add ORD-123456789 "Mensaje de prueba"');
      return;
    }
    
    // Conectar a la base de datos
    await connectToDatabase();
    console.log('Conexión a la base de datos establecida');
    
    // Ejecutar la acción correspondiente
    switch (action.toLowerCase()) {
      case 'order':
        await getMessagesByOrderId(param);
        break;
      case 'phone':
        await getMessagesByPhone(param);
        break;
      case 'add':
        const message = process.argv[4];
        if (!message) {
          console.error('Error: Falta el mensaje');
          return;
        }
        await addTestMessage(param, message);
        break;
      default:
        console.error(`Error: Acción desconocida: ${action}`);
        console.log('Acciones válidas: order, phone, add');
    }
    
    console.log('\nPrueba completada');
  } catch (error) {
    console.error('Error en la prueba de chat:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    process.exit(0);
  }
}

/**
 * Obtiene los mensajes de chat para un pedido específico
 * @param {string} orderId - ID del pedido
 */
async function getMessagesByOrderId(orderId) {
  try {
    console.log(`\nBuscando mensajes para el pedido: ${orderId}`);
    
    // Verificar que el pedido existe
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      console.error(`Error: No se encontró el pedido con ID ${orderId}`);
      return;
    }
    
    console.log('Información del pedido:');
    console.log(`- ID: ${order.order_id}`);
    console.log(`- Cliente: ${order.customer.first_name} ${order.customer.last_name}`);
    console.log(`- Teléfono: ${order.customer.phone}`);
    console.log(`- Estado: ${order.status}`);
    console.log(`- Fecha de creación: ${order.created_at}`);
    
    // Obtener mensajes del pedido
    const messages = await chatService.getMessagesByOrderId(orderId);
    
    if (messages.length === 0) {
      console.log('\nNo hay mensajes para este pedido');
      return;
    }
    
    console.log(`\nMensajes encontrados: ${messages.length}`);
    displayMessages(messages);
  } catch (error) {
    console.error(`Error al obtener mensajes para el pedido ${orderId}:`, error);
  }
}

/**
 * Obtiene los mensajes de chat para un número de teléfono específico
 * @param {string} phone - Número de teléfono
 */
async function getMessagesByPhone(phone) {
  try {
    console.log(`\nBuscando mensajes para el teléfono: ${phone}`);
    
    // Buscar pedidos asociados al número de teléfono
    const orders = await orderService.getOrdersByPhone(phone);
    
    if (!orders || orders.length === 0) {
      console.log(`No se encontraron pedidos para el teléfono ${phone}`);
    } else {
      console.log(`Pedidos encontrados: ${orders.length}`);
      orders.forEach((order, index) => {
        console.log(`\nPedido ${index + 1}:`);
        console.log(`- ID: ${order.order_id}`);
        console.log(`- Cliente: ${order.customer.first_name} ${order.customer.last_name}`);
        console.log(`- Estado: ${order.status}`);
        console.log(`- Fecha de creación: ${order.created_at}`);
      });
    }
    
    // Obtener mensajes por teléfono
    const messages = await chatService.getMessagesByPhone(phone);
    
    if (messages.length === 0) {
      console.log('\nNo hay mensajes para este número de teléfono');
      return;
    }
    
    console.log(`\nMensajes encontrados: ${messages.length}`);
    displayMessages(messages);
  } catch (error) {
    console.error(`Error al obtener mensajes para el teléfono ${phone}:`, error);
  }
}

/**
 * Agrega un mensaje de prueba a un pedido
 * @param {string} orderId - ID del pedido
 * @param {string} message - Texto del mensaje
 */
async function addTestMessage(orderId, message) {
  try {
    console.log(`\nAgregando mensaje de prueba al pedido: ${orderId}`);
    console.log(`Mensaje: "${message}"`);
    
    // Verificar que el pedido existe
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      console.error(`Error: No se encontró el pedido con ID ${orderId}`);
      return;
    }
    
    // Determinar el remitente (alternando entre CUSTOMER y ADMIN)
    const sender = Math.random() > 0.5 ? 'CUSTOMER' : 'ADMIN';
    
    // Guardar el mensaje
    const savedMessage = await chatService.saveMessage({
      order_id: orderId,
      sender,
      message,
      phone: order.customer.phone,
      message_type: 'TEXT',
      created_at: new Date()
    });
    
    console.log('\nMensaje guardado correctamente:');
    console.log(`- ID: ${savedMessage._id}`);
    console.log(`- Remitente: ${savedMessage.sender}`);
    console.log(`- Mensaje: ${savedMessage.message}`);
    console.log(`- Fecha: ${savedMessage.created_at}`);
    
    // Obtener todos los mensajes del pedido
    const messages = await chatService.getMessagesByOrderId(orderId);
    
    console.log(`\nTotal de mensajes del pedido: ${messages.length}`);
    displayMessages(messages);
  } catch (error) {
    console.error(`Error al agregar mensaje de prueba:`, error);
  }
}

/**
 * Muestra los mensajes en la consola
 * @param {Array} messages - Lista de mensajes
 */
function displayMessages(messages) {
  messages.forEach((msg, index) => {
    const date = new Date(msg.created_at).toLocaleString();
    const sender = msg.sender === 'CUSTOMER' ? '👤 CLIENTE' : 
                  msg.sender === 'SYSTEM' ? '🤖 SISTEMA' : '👨‍💼 ADMIN';
    
    console.log(`\n[${index + 1}] ${date} - ${sender}:`);
    console.log(`${msg.message}`);
    
    if (msg.message_type !== 'TEXT') {
      console.log(`Tipo: ${msg.message_type}`);
    }
    
    if (msg.button_payload) {
      console.log(`Payload: ${msg.button_payload}`);
    }
  });
}

// Ejecutar la prueba
testChat(); 