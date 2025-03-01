// Endpoint para el webhook
const { connectToDatabase } = require('../database/connection');
const orderService = require('../database/services/orderService');
const chatService = require('../database/services/chatService');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { sendTextMessage, sendButtonMessage, sendTemplateMessage, formatPhoneNumber } = require('../utils/whatsapp-api');

// Función para procesar mensajes entrantes de WhatsApp
async function processIncomingMessage(message, metadata) {
  try {
    console.log('Procesando mensaje entrante:', JSON.stringify(message, null, 2));
    
    // Extraer información del mensaje
    const from = message.from;
    let messageText = '';
    let messageType = 'TEXT';
    let buttonPayload = null;
    
    // Determinar el tipo de mensaje y extraer el texto
    if (message.type === 'text' && message.text) {
      messageText = message.text.body;
    } else if (message.type === 'button' && message.button) {
      messageText = message.button.text;
      buttonPayload = message.button.payload;
      messageType = 'BUTTON';
    } else if (message.type === 'interactive' && message.interactive) {
      if (message.interactive.type === 'button_reply') {
        messageText = message.interactive.button_reply.title;
        buttonPayload = message.interactive.button_reply.id;
        messageType = 'BUTTON';
      } else if (message.interactive.type === 'list_reply') {
        messageText = message.interactive.list_reply.title;
        buttonPayload = message.interactive.list_reply.id;
        messageType = 'BUTTON';
      }
    } else if (message.type === 'location' && message.location) {
      messageText = `Ubicación: ${message.location.latitude}, ${message.location.longitude}`;
      messageType = 'LOCATION';
    } else if (message.type === 'image' && message.image) {
      messageText = message.image.caption || 'Imagen recibida';
      messageType = 'IMAGE';
    } else if (message.type === 'document' && message.document) {
      messageText = message.document.caption || 'Documento recibido';
      messageType = 'DOCUMENT';
    } else if (message.type === 'audio' && message.audio) {
      messageText = 'Audio recibido';
      messageType = 'AUDIO';
    } else if (message.type === 'video' && message.video) {
      messageText = message.video.caption || 'Video recibido';
      messageType = 'VIDEO';
    } else {
      messageText = `Mensaje de tipo ${message.type} recibido`;
    }
    
    // Guardar el mensaje en la base de datos
    await chatService.saveWhatsAppMessage({
      from,
      text: messageText,
      type: messageType,
      buttonPayload,
      timestamp: message.timestamp
    });
    
    console.log(`Mensaje guardado correctamente para el número ${from}`);
    return true;
  } catch (error) {
    console.error('Error al procesar mensaje entrante:', error);
    return false;
  }
}

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
      
      // Conectar a la base de datos
      await connectToDatabase();
      
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
                  
                  // Procesar cada mensaje recibido
                  for (const message of change.value.messages) {
                    await processIncomingMessage(message, change.value.metadata);
                  }
                  
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
      
      // Si no es una notificación de WhatsApp, asumimos que es un pedido nuevo
      const order = req.body;
      console.log('Orden recibida:', order);

      if (!order || !order.customer || !order.shipping_address) {
        return res.status(400).json({ error: "Datos del pedido incompletos." });
      }

      // Buscar el número de teléfono en múltiples lugares del objeto de la orden
      let customerPhone = null;
      
      // 1. Intentar obtener de customer.phone
      if (order.customer && order.customer.phone) {
        customerPhone = order.customer.phone;
      } 
      // 2. Intentar obtener del objeto principal
      else if (order.phone) {
        customerPhone = order.phone;
      } 
      // 3. Intentar obtener de shipping_address.phone
      else if (order.shipping_address && order.shipping_address.phone) {
        customerPhone = order.shipping_address.phone;
      }
      // 4. Intentar obtener de billing_address.phone
      else if (order.billing_address && order.billing_address.phone) {
        customerPhone = order.billing_address.phone;
      }
      // 5. Intentar obtener de note_attributes
      else if (order.note_attributes && Array.isArray(order.note_attributes)) {
        const phoneNote = order.note_attributes.find(note => note.name === 'phone');
        if (phoneNote && phoneNote.value) {
          customerPhone = phoneNote.value;
        }
      }
      
      // Si aún no se encontró un número, usar el valor por defecto
      if (!customerPhone) {
        customerPhone = "573232205135"; // Número por defecto
        console.log('No se encontró número de teléfono en la orden, usando número por defecto:', customerPhone);
      } else {
        console.log('Número de teléfono encontrado en la orden:', customerPhone);
      }
      
      // Asegurarse de que el cliente tenga un número de teléfono antes de guardar
      if (order.customer) {
        order.customer.phone = customerPhone;
        console.log('Asignando número de teléfono al cliente:', customerPhone);
      }

      // Guardar el pedido en la base de datos con estado CREATED
      const savedOrder = await orderService.createOrder(order);
      console.log(`Pedido guardado en la base de datos con ID: ${savedOrder.order_id}`);

      // Usar el número de teléfono que encontramos
      const formattedPhone = formatPhoneNumber(customerPhone);

      try {
        console.log(`Enviando mensaje de confirmación a ${formattedPhone}`);
        
        // Preparar los datos para la plantilla
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

        // Obtener el nombre de la plantilla desde variables de entorno o usar el valor por defecto
        // IMPORTANTE: Asegúrate de que este nombre coincida EXACTAMENTE con el nombre en Meta Business
        const templateName = process.env.TEMPLATE_NAME || "validate_order";
        const languageCode = process.env.TEMPLATE_LANGUAGE || "es";
        
        console.log(`Intentando enviar plantilla: ${templateName} en idioma: ${languageCode}`);
        console.log(`Datos para la plantilla:
          - Nombre: ${customerName}
          - Pedido: ${pedido}
          - Total: ${totalAmount}
          - Ciudad: ${city}
          - Dirección: ${address}
        `);

        try {
          // Preparar los parámetros para la plantilla
          // IMPORTANTE: Los parámetros deben estar en el MISMO ORDEN que en la plantilla
          // Para la plantilla validate_order, el orden es:
          // 1. {{nombre}} - Nombre del cliente
          // 2. {{pedido}} - Descripción del pedido
          // 3. {{total}} - Monto total
          // 4. {{ciudad}} - Ciudad de entrega
          // 5. {{direccion}} - Dirección de entrega
          const parameters = [
            { type: "text", text: customerName },  // {{nombre}}
            { type: "text", text: pedido },        // {{pedido}}
            { type: "text", text: totalAmount },   // {{total}}
            { type: "text", text: city },          // {{ciudad}}
            { type: "text", text: address }        // {{direccion}}
          ];
          
          // Enviar mensaje usando la plantilla
          const response = await sendTemplateMessage(formattedPhone, templateName, languageCode, parameters);
          console.log('Respuesta de plantilla:', response);
          
          // Actualizar el estado del pedido a MESSAGE_SENT
          await orderService.updateOrderMessageStatus(
            savedOrder.order_id, 
            true, 
            { id: response.messages?.[0]?.id }
          );
          
          // Guardar el mensaje enviado en el chat
          await chatService.saveSystemMessage(
            savedOrder.order_id,
            formattedPhone,
            `Mensaje de plantilla enviado: ${templateName}`,
            'TEMPLATE'
          );
          
          console.log(`Plantilla ${templateName} enviada correctamente`);
        } catch (templateError) {
          console.error(`Error al enviar plantilla ${templateName}:`, templateError);
          
          // Registrar el error detallado para diagnóstico
          if (templateError.message && templateError.message.includes('Template name does not exist')) {
            console.error('ERROR DE PLANTILLA: La plantilla no existe o no está aprobada en el idioma especificado');
            console.error('Verifica el nombre exacto de la plantilla en Meta Business Manager');
          }
          
          // Reenviar el error para que se maneje en el catch externo
          throw templateError;
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