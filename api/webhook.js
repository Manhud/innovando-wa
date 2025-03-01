// Endpoint para el webhook
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { sendTextMessage, sendButtonMessage, sendTemplateMessage, formatPhoneNumber } = require('../utils/whatsapp-api');

module.exports = async (req, res) => {
  // Siempre responder con 200 OK para evitar que Meta reintente constantemente
  // Esto es una práctica recomendada para webhooks de WhatsApp
  const respondSuccess = () => res.status(200).json({ status: 'ok' });

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

  // Manejar solicitudes POST
  if (req.method === 'POST') {
    try {
      console.log('Webhook POST recibido:', JSON.stringify(req.body, null, 2));
      
      // Verificar si es una notificación de WhatsApp
      if (req.body.object === 'whatsapp_business_account') {
        console.log('Notificación de WhatsApp Business recibida');
        
        // Procesar la notificación de WhatsApp
        if (req.body.entry && req.body.entry.length > 0) {
          for (const entry of req.body.entry) {
            if (entry.changes && entry.changes.length > 0) {
              for (const change of entry.changes) {
                if (change.value && change.value.messages && change.value.messages.length > 0) {
                  console.log('Mensajes encontrados en la notificación');
                  
                  // Responder a la notificación para evitar reenvíos
                  return respondSuccess();
                }
              }
            }
          }
        }
        
        // Si llegamos aquí, es una notificación sin mensajes
        console.log('Notificación sin mensajes');
        return respondSuccess();
      }
      
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
      const address = order.shipping_address?.address1 || "Dirección desconocida";

      // Número de teléfono del cliente (con formato internacional)
      const customerPhone = order.customer?.phone || "573232205135"; // Número por defecto si no hay teléfono
      const formattedPhone = formatPhoneNumber(customerPhone);

      try {
        console.log(`Enviando mensaje de confirmación a ${formattedPhone}`);
        
        // Opción 1: Usar plantilla predefinida
        if (process.env.USE_TEMPLATE === 'true') {
          const parameters = [
            { type: "text", text: customerName },
            { type: "text", text: pedido },
            { type: "text", text: totalAmount },
            { type: "text", text: city },
            { type: "text", text: address }
          ];
          
          const response = await sendTemplateMessage(formattedPhone, "validate_order", "es", parameters);
          console.log('Respuesta de plantilla:', response);
          
          // Actualizar el estado del pedido a MESSAGE_SENT
          await orderService.updateOrderMessageStatus(
            savedOrder.order_id, 
            true, 
            { id: response.messages?.[0]?.id }
          );
        } 
        // Opción 2: Usar mensaje con botones
        else {
          const bodyText = `Hola ${customerName}, hemos recibido tu pedido de ${pedido} por $${totalAmount} con envío a ${city}, ${address}. ¿Deseas confirmar?`;
          
          const buttons = [
            { id: "confirm", title: "Confirmar pedido" },
            { id: "change", title: "Modificar pedido" },
            { id: "cancel", title: "Cancelar pedido" }
          ];
          
          const response = await sendButtonMessage(
            formattedPhone,
            bodyText,
            buttons,
            "Confirmación de Pedido",
            "Selecciona una opción"
          );
          
          console.log('Respuesta de botones:', response);
          
          // Actualizar el estado del pedido a MESSAGE_SENT
          await orderService.updateOrderMessageStatus(
            savedOrder.order_id, 
            true, 
            { id: response.messages?.[0]?.id }
          );
        }
        
        return res.status(200).json({ 
          message: "Mensaje enviado correctamente.",
          order_id: savedOrder.order_id,
          status: 'MESSAGE_SENT'
        });
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
      return res.status(500).json({ error: "Error en el servidor.", details: error.message });
    }
  }

  // Si el método no es GET, POST u OPTIONS
  return res.status(405).json({ error: "Método no permitido" });
};