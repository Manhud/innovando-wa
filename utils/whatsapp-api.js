const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Formatea un número de teléfono para asegurar que tenga el formato correcto para WhatsApp
 * @param {string} phone - Número de teléfono a formatear
 * @returns {string} - Número formateado
 */
function formatPhoneNumber(phone) {
  if (!phone || phone === null) {
    console.error('Error: Número de teléfono nulo o vacío');
    return '';
  }
  
  // Eliminar todos los caracteres no numéricos
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Asegurarse de que tenga el prefijo de país (57 para Colombia)
  if (!cleaned.startsWith('57') && cleaned.length >= 10) {
    cleaned = '57' + cleaned;
  }
  
  console.log(`Número formateado: ${phone} -> ${cleaned}`);
  return cleaned;
}

/**
 * Envía un mensaje de texto simple a través de WhatsApp
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} message - Mensaje a enviar
 * @param {number} retryCount - Número de intentos (para uso interno)
 * @returns {Promise<object>} - Respuesta de la API
 */
async function sendTextMessage(to, message, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 segundo

  try {
    // Formatear el número de teléfono
    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      throw new Error('Número de teléfono inválido');
    }
    
    console.log(`Intentando enviar mensaje a ${formattedPhone} (intento ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    const url = `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`;
    console.log(`URL de la API: ${url}`);
    
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: { 
        body: message 
      }
    };
    
    console.log(`Cuerpo de la solicitud: ${JSON.stringify(body)}`);
    
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
        // Añadir timeout para evitar que la solicitud se quede colgada
        timeout: 8000
      }
    );

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Error response:', responseData);
      throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(responseData)}`);
    }

    console.log('Mensaje enviado exitosamente:', responseData);
    return responseData;
  } catch (error) {
    console.error(`Error sending text message (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
    
    // Si es un error de red y no hemos excedido los reintentos, intentar de nuevo
    if ((error.code === 'UND_ERR_SOCKET' || error.message?.includes('fetch failed') || error.cause?.code === 'UND_ERR_SOCKET') 
        && retryCount < MAX_RETRIES) {
      console.log(`Reintentando en ${RETRY_DELAY}ms...`);
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      
      // Reintentar con contador incrementado
      return sendTextMessage(to, message, retryCount + 1);
    }
    
    // Si hemos agotado los reintentos o es otro tipo de error, registrar y propagar
    console.error('Error final después de reintentos o error no recuperable:', error);
    throw error;
  }
}

/**
 * Envía un mensaje interactivo con botones a través de WhatsApp
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} headerText - Texto del encabezado (opcional)
 * @param {string} bodyText - Texto del cuerpo del mensaje
 * @param {string} footerText - Texto del pie (opcional)
 * @param {Array} buttons - Array de objetos de botones {id, title}
 * @returns {Promise<object>} - Respuesta de la API
 */
async function sendButtonMessage(to, bodyText, buttons, headerText = '', footerText = '') {
  try {
    // Formatear el número de teléfono
    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      throw new Error('Número de teléfono inválido');
    }
    
    console.log(`Enviando mensaje con botones a ${formattedPhone}`);
    
    // Preparar los botones en el formato requerido
    const formattedButtons = buttons.map(button => ({
      type: "reply",
      reply: {
        id: button.id,
        title: button.title
      }
    }));
    
    const url = `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`;
    
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: bodyText
        },
        action: {
          buttons: formattedButtons
        }
      }
    };
    
    // Añadir header si se proporciona
    if (headerText) {
      body.interactive.header = {
        type: "text",
        text: headerText
      };
    }
    
    // Añadir footer si se proporciona
    if (footerText) {
      body.interactive.footer = {
        text: footerText
      };
    }
    
    console.log(`Cuerpo de la solicitud de botones: ${JSON.stringify(body)}`);
    
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
        timeout: 8000
      }
    );

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Error al enviar mensaje con botones:', responseData);
      throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(responseData)}`);
    }

    console.log('Mensaje con botones enviado exitosamente:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error al enviar mensaje con botones:', error);
    throw error;
  }
}

/**
 * Envía un mensaje de plantilla a través de WhatsApp
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} templateName - Nombre de la plantilla
 * @param {string} languageCode - Código de idioma (ej. 'es')
 * @param {Array} parameters - Parámetros para la plantilla
 * @returns {Promise<object>} - Respuesta de la API
 */
async function sendTemplateMessage(to, templateName, languageCode = 'es', parameters = []) {
  try {
    // Formatear el número de teléfono
    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      throw new Error('Número de teléfono inválido');
    }
    
    console.log(`Enviando mensaje de plantilla a ${formattedPhone}`);
    
    const url = `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`;
    
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: []
      }
    };
    
    // Añadir parámetros si se proporcionan
    if (parameters && parameters.length > 0) {
      body.template.components = [
        {
          type: "body",
          parameters: parameters
        }
      ];
    }
    
    console.log(`Cuerpo de la solicitud de plantilla: ${JSON.stringify(body)}`);
    
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
        timeout: 8000
      }
    );

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Error al enviar mensaje de plantilla:', responseData);
      throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(responseData)}`);
    }

    console.log('Mensaje de plantilla enviado exitosamente:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error al enviar mensaje de plantilla:', error);
    throw error;
  }
}

module.exports = {
  sendTextMessage,
  sendButtonMessage,
  sendTemplateMessage,
  formatPhoneNumber
};