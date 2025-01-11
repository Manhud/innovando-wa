module.exports = async (req, res) => {
  // Verificar método
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Configurar CORS si es necesario
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const order = req.body;
    console.log('Orden recibida:', order);

    if (!order || !order.customer || !order.shipping_address) {
      return res.status(400).json({ error: "Datos del pedido incompletos." });
    }

    const customerName = order.customer.first_name || "Cliente";
    const customerPhone = order.customer.phone || "";
    const orderId = order.id || "Sin ID";
    const totalAmount = order.total_price || "0.00";
    const city = order.shipping_address.city || "Ciudad desconocida";
    const address = order.shipping_address.address1 || "Dirección desconocida";

    if (!customerPhone) {
      return res.status(400).json({ error: "Número de teléfono no proporcionado." });
    }

    const message = {
      messaging_product: "whatsapp",
      to: "3232205135",
      type: "template",
      template: {
        name: "confirma_tu_pedido",
        language: { code: "es" },
        components: [
          { 
            type: "body", 
            parameters: [
              { type: "text", text: customerName },
              { type: "text", text: orderId },
              { type: "text", text: `$${totalAmount}` },
              { type: "text", text: city },
              { type: "text", text: address }
            ]
          }
        ]
      }
    };

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
        body: JSON.stringify(message),
      }
    );

    if (response.ok) {
      return res.status(200).json({ message: "Mensaje enviado correctamente." });
    } else {
      const errorDetails = await response.json();
      console.error("Error en la respuesta de WhatsApp:", errorDetails);
      return res.status(500).json({
        message: "Error al enviar el mensaje de WhatsApp.",
        details: errorDetails,
      });
    }
  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({ error: "Error en el servidor." });
  }
};