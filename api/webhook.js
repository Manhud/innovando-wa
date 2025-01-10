require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const order = req.body;
  console.log(order);
  if (!order || !order.customer || !order.shipping_address) {
    return res.status(400).send("Datos del pedido incompletos.");
  }

  const customerName = order.customer.first_name || "Cliente";
  const customerPhone = order.customer.phone || "";
  const orderId = order.id || "Sin ID";
  const totalAmount = order.total_price || "0.00";
  const city = order.shipping_address.city || "Ciudad desconocida";
  const address = order.shipping_address.address1 || "Dirección desconocida";

  if (!customerPhone) {
    return res.status(400).send("Número de teléfono no proporcionado.");
  }

  const message = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "template",
    template: {
      name: "confirma_tu_pedido",
      language: { code: "es" },
      components: [
        { type: "body", parameters: [
            { type: "text", text: customerName },
            { type: "text", text: orderId },
            { type: "text", text: `$${totalAmount}` },
            { type: "text", text: city },
            { type: "text", text: address }
        ]}
      ]
    }
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      res.status(200).send("Mensaje enviado correctamente.");
    } else {
      const errorDetails = await response.json();
      console.error("Error en la respuesta de WhatsApp:", errorDetails);
      res.status(500).send({
        message: "Error al enviar el mensaje de WhatsApp.",
        details: errorDetails,
      });
    }
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).send("Error en el servidor.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));
