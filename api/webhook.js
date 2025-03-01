// Endpoint para el webhook
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Manejar solicitudes GET (verificación del webhook)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Verificación de webhook recibida:', { mode, token: token ? '***' : undefined, challenge });

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('Webhook verificado!');
      return res.status(200).send(challenge);
    }
    
    console.error('Verificación de webhook fallida: token inválido o modo incorrecto');
    return res.status(403).end();
  }

  // Manejar solicitudes POST (recibir pedidos)
  if (req.method === 'POST') {
    try {
      // Conectar a la base de datos
      await connectToDatabase();
      
      const order = req.body;
      console.log('Orden recibida:', order);

      if (!order || !order.customer || !order.shipping_address) {
        return res.status(400).json({ error: "Datos del pedido incompletos." });
      }

      // Guardar el pedido en la base de datos con estado CREATED
      const savedOrder = await orderService.createOrder(order);
      console.log(`Pedido guardado en la base de datos con ID: ${savedOrder.order_id}`);

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
          }
        );

        if (response.ok) {
          const responseData = await response.json();
          
          // Actualizar el estado del pedido a MESSAGE_SENT
          await orderService.updateOrderMessageStatus(
            savedOrder.order_id, 
            true, 
            { id: responseData.messages?.[0]?.id }
          );
          
          return res.status(200).json({ 
            message: "Mensaje enviado correctamente.",
            order_id: savedOrder.order_id,
            status: 'MESSAGE_SENT'
          });
        } else {
          const errorDetails = await response.json();
          console.error("Error en la respuesta de WhatsApp:", errorDetails);
          
          // Actualizar el estado del pedido a MESSAGE_FAILED
          await orderService.updateOrderMessageStatus(
            savedOrder.order_id, 
            false, 
            { error: errorDetails.error?.message || 'Error desconocido' }
          );
          
          return res.status(500).json({
            message: "Error al enviar el mensaje de WhatsApp.",
            details: errorDetails,
            order_id: savedOrder.order_id,
            status: 'MESSAGE_FAILED'
          });
        }
      } catch (whatsappError) {
        console.error("Error al enviar mensaje a WhatsApp:", whatsappError);
        
        // Actualizar el estado del pedido a MESSAGE_FAILED
        await orderService.updateOrderMessageStatus(
          savedOrder.order_id, 
          false, 
          { error: whatsappError.message || 'Error de conexión' }
        );
        
        return res.status(500).json({ 
          error: "Error al enviar el mensaje a WhatsApp.",
          order_id: savedOrder.order_id,
          status: 'MESSAGE_FAILED'
        });
      }
    } catch (error) {
      console.error("Error en el servidor:", error);
      return res.status(500).json({ error: "Error en el servidor." });
    }
  }

  // Si el método no es GET, POST u OPTIONS
  return res.status(405).json({ error: "Método no permitido" });
};