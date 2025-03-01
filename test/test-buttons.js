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
    
    // Datos de ejemplo para el mensaje
    const customerName = "John Smith";
    const pedido = "1x Amortiguador Anti Golpe De Puerta Carro X10, 1x Encendedor Eléctrico Recargable USB";
    const totalAmount = "74.880";
    const city = "Shippington";
    const address = "123 Shipping Street";
    
    // Mensaje con el formato original
    const message = `
¡Hola, ${customerName} -!
Recuerda por favor verificar todos tus datos y confirmar tu pedido.

✅ Te escribimos de *INNOVANDOSHOP.COM*, hemos recibido tu orden que contiene ${pedido} por un valor total a pagar de $${totalAmount}

🚚 Tu pedido se entregará en la ciudad de ${city}. en la dirección ${address} -  en el transcurso de 2 a 4 días hábiles.

🚨Debido al alto volumen de pedidos que tenemos al día, priorizamos las entregas de quienes confirman su pedido.

*¡Gracias por confiar en INNOVANDO!* 😀`;
    
    // Probar envío de mensaje con botones
    console.log('Enviando mensaje con botones...');
    
    const buttons = [
      { id: "confirm", title: "Confirmar pedido" },
      { id: "change", title: "Modificar pedido" },
      { id: "cancel", title: "Cancelar pedido" }
    ];
    
    const result = await sendButtonMessage(
      testPhone,
      message,
      buttons,
      "CONFIRMA TU PEDIDO",
      ""
    );
    
    console.log('Resultado del mensaje con botones:', result);
    console.log('Prueba completada con éxito');
  } catch (error) {
    console.error('Error en la prueba de botones:', error);
  }
}

// Ejecutar la prueba
testButtons(); 