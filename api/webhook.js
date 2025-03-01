module.exports = async (req, res) => {
  // Responder inmediatamente para evitar timeouts en Vercel
  res.status(200).json({ message: "Webhook recibido" });
  
  // Verificar método - solo para logging, ya respondimos arriba
  if (req.method !== 'POST') {
    console.log('Método no permitido:', req.method);
    return;
  }

  try {
    const order = req.body;
    
    // Validación básica
    if (!order || !order.customer || !order.shipping_address) {
      console.error("Datos del pedido incompletos.");
      return;
    }

    // Procesamiento asíncrono después de responder al cliente
    const customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || "Cliente";
    const pedido = order.line_items
      ?.map(item => `${item.quantity}x ${item.name}`)
      .join(", ") || "productos";
    const totalAmount = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(order.total_price || 0);

    const city = order.shipping_address?.city || "Ciudad desconocida";
    const address = order.shipping_address?.address1 || "Dirección desconocida"

    const message = {
      messaging_product: "whatsapp",
      "recipient_type": "individual",
      to: "573232205135",
      type: "template",
      template: {
        name: "validate_order",
        language: { code: "es" },
        components: [
          { 
            type: "body", 
            parameters: [
              { type: "text", text: customerName, parameter_name: "nombre" },
              { type: "text", text: pedido, parameter_name: "pedido" },
              { type: "text", text: totalAmount, parameter_name: "total" },
              { type: "text", text: city, parameter_name: "ciudad" },
              { type: "text", text: address, parameter_name: "direccion" }
            ]
          }
        ]
      }
    };

    // Usar la función optimizada de whatsapp-api.js
    const { sendTextMessage } = require('../utils/whatsapp-api');
    
    try {
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          },
          body: JSON.stringify(message),
          // Añadir timeout para evitar bloqueos
          timeout: 5000
        }
      );

      if (response.ok) {
        console.log("Mensaje enviado correctamente.");
      } else {
        const errorDetails = await response.json();
        console.error("Error en la respuesta de WhatsApp:", errorDetails);
      }
    } catch (error) {
      console.error("Error al enviar mensaje a WhatsApp:", error.message || error);
    }
  } catch (error) {
    console.error("Error en el procesamiento del webhook:", error.message || error);
  }
};