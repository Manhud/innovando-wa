// Importar node-fetch para entornos de Node.js
const fetch = require('node-fetch');

/**
 * Envía un mensaje de texto simple a través de WhatsApp
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} message - Mensaje a enviar
 * @param {number} retryCount - Número de intentos (para uso interno)
 * @returns {Promise<object>} - Respuesta de la API
 */
async function sendTextMessage(to, message, retryCount = 0) {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 500; // 500 ms

  try {
    console.log(`Intentando enviar mensaje a ${to} (intento ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    const url = `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`;
    
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: { 
        body: message 
      }
    };
    
    // Reducir el logging para mejorar el rendimiento
    if (retryCount === 0) {
      console.log(`URL de la API: ${url}`);
      console.log(`Cuerpo de la solicitud: ${JSON.stringify(body)}`);
    }
    
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
        // Reducir el timeout para evitar bloqueos largos
        timeout: 5000
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    console.log('Mensaje enviado exitosamente:', responseData.messages?.[0]?.id || 'ID no disponible');
    return responseData;
  } catch (error) {
    console.error(`Error sending text message (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error.message);
    
    // Si es un error de red y no hemos excedido los reintentos, intentar de nuevo
    if ((error.code === 'UND_ERR_SOCKET' || error.message?.includes('fetch failed') || error.cause?.code === 'UND_ERR_SOCKET' || error.type === 'request-timeout') 
        && retryCount < MAX_RETRIES) {
      console.log(`Reintentando en ${RETRY_DELAY}ms...`);
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      
      // Reintentar con contador incrementado
      return sendTextMessage(to, message, retryCount + 1);
    }
    
    // Si hemos agotado los reintentos o es otro tipo de error, registrar y propagar
    console.error('Error final después de reintentos o error no recuperable:', error.message);
    // No lanzar el error para evitar que falle toda la función
    return { error: error.message };
  }
}

// Exportar funciones usando sintaxis CommonJS
module.exports = {
  sendTextMessage
};