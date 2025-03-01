require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Script para enviar un pedido de prueba al webhook
 */
async function sendTestOrder() {
  try {
    console.log('Enviando pedido de prueba al webhook...');
    
    // URL del webhook (local o desplegado)
    const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook';
    
    // Datos de prueba del pedido
    const testOrder = {
      order_id: `TEST-${Date.now()}`,
      customer: {
        first_name: 'Cliente',
        last_name: 'Prueba',
        email: 'cliente@ejemplo.com',
        phone: '573001234567'
      },
      shipping_address: {
        address1: 'Calle 123 #45-67',
        city: 'Bogotá',
        state: 'Cundinamarca',
        postal_code: '110111',
        country: 'Colombia'
      },
      line_items: [
        {
          name: 'Producto de Prueba 1',
          quantity: 2,
          price: 25000
        },
        {
          name: 'Producto de Prueba 2',
          quantity: 1,
          price: 35000
        }
      ],
      total_price: 85000
    };
    
    console.log('Datos del pedido:', JSON.stringify(testOrder, null, 2));
    
    // Enviar la solicitud al webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });
    
    // Procesar la respuesta
    const responseData = await response.json();
    
    if (response.ok) {
      console.log('Pedido enviado correctamente');
      console.log('Respuesta:', responseData);
    } else {
      console.error('Error al enviar el pedido');
      console.error('Respuesta:', responseData);
    }
  } catch (error) {
    console.error('Error al enviar el pedido de prueba:', error);
  }
}

// Ejecutar la función
sendTestOrder(); 