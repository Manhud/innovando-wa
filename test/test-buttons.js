require('dotenv').config();
const { sendButtonMessage } = require('../utils/whatsapp-api');

/**
 * Script para probar el envío de mensajes con botones a WhatsApp
 */
async function testButtons() {
  try {
    console.log('Iniciando prueba de mensajes con botones...');
    
    // Verificar variables de entorno
    if (!process.env.PHONE_NUMBER_ID || !process.env.ACCESS_TOKEN) {
      console.error('Error: Faltan variables de entorno PHONE_NUMBER_ID o ACCESS_TOKEN');
      return;
    }
    
    // Número de teléfono para pruebas (debe ser un número registrado en WhatsApp)
    const testPhone = process.argv[2] || '573232205135';
    console.log(`Usando número de teléfono: ${testPhone}`);
    
    // Probar envío de mensaje con botones
    console.log('Enviando mensaje con botones...');
    
    const bodyText = "¿Qué acción deseas realizar con tu pedido?";
    const buttons = [
      { id: "confirm", title: "Confirmar pedido" },
      { id: "change", title: "Modificar pedido" },
      { id: "cancel", title: "Cancelar pedido" }
    ];
    
    const result = await sendButtonMessage(
      testPhone,
      bodyText,
      buttons,
      "Confirmación de Pedido",
      "Selecciona una opción"
    );
    
    console.log('Resultado del mensaje con botones:', result);
    console.log('Prueba completada con éxito');
  } catch (error) {
    console.error('Error en la prueba de botones:', error);
  }
}

// Ejecutar la prueba
testButtons(); 