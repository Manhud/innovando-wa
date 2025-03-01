const ChatMessage = require('../models/ChatMessage');
const orderService = require('./orderService');

/**
 * Servicio para manejar las operaciones con los mensajes de chat
 */
const chatService = {
  /**
   * Guarda un nuevo mensaje de chat
   * @param {Object} messageData - Datos del mensaje
   * @returns {Promise<Object>} Mensaje guardado
   */
  async saveMessage(messageData) {
    try {
      const message = new ChatMessage(messageData);
      await message.save();
      console.log(`Mensaje guardado para el pedido: ${messageData.order_id}`);
      return message;
    } catch (error) {
      console.error('Error al guardar el mensaje de chat:', error);
      throw error;
    }
  },

  /**
   * Obtiene los mensajes de chat para un pedido específico
   * @param {string} orderId - ID del pedido
   * @returns {Promise<Array>} Lista de mensajes
   */
  async getMessagesByOrderId(orderId) {
    try {
      const messages = await ChatMessage.find({ order_id: orderId })
        .sort({ created_at: 1 });
      return messages;
    } catch (error) {
      console.error(`Error al obtener mensajes para el pedido ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene los mensajes de chat para un número de teléfono específico
   * @param {string} phone - Número de teléfono
   * @returns {Promise<Array>} Lista de mensajes
   */
  async getMessagesByPhone(phone) {
    try {
      // Limpiar el número de teléfono para la búsqueda
      const cleanedPhone = phone.replace(/\D/g, '');
      const lastTenDigits = cleanedPhone.slice(-10);
      
      // Crear patrones para buscar diferentes formatos del número
      const phonePatterns = [
        cleanedPhone,
        lastTenDigits,
        `57${lastTenDigits}`,
        `+57${lastTenDigits}`
      ];
      
      console.log(`Buscando mensajes para el teléfono: ${phone}`);
      console.log('Patrones de búsqueda:', phonePatterns);
      
      const messages = await ChatMessage.find({
        phone: { $in: phonePatterns }
      }).sort({ created_at: 1 });
      
      return messages;
    } catch (error) {
      console.error(`Error al obtener mensajes para el teléfono ${phone}:`, error);
      throw error;
    }
  },

  /**
   * Guarda un mensaje recibido de WhatsApp y lo asocia con un pedido
   * @param {Object} whatsappMessage - Mensaje recibido de WhatsApp
   * @returns {Promise<Object>} Mensaje guardado
   */
  async saveWhatsAppMessage(whatsappMessage) {
    try {
      const { from, text, type = 'TEXT', timestamp } = whatsappMessage;
      
      // Buscar pedidos asociados con este número de teléfono
      const orders = await orderService.getOrdersByPhone(from);
      
      // Si no hay pedidos, guardar el mensaje sin asociarlo a un pedido
      if (!orders || orders.length === 0) {
        console.log(`No se encontraron pedidos para el teléfono ${from}. Guardando mensaje sin asociación.`);
        return await this.saveMessage({
          order_id: 'SIN_PEDIDO',
          sender: 'CUSTOMER',
          message: text,
          phone: from,
          message_type: type,
          created_at: timestamp ? new Date(timestamp * 1000) : new Date()
        });
      }
      
      // Usar el pedido más reciente para asociar el mensaje
      const latestOrder = orders.reduce((latest, current) => {
        return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
      }, orders[0]);
      
      console.log(`Asociando mensaje al pedido: ${latestOrder.order_id}`);
      
      // Guardar el mensaje asociado al pedido
      return await this.saveMessage({
        order_id: latestOrder.order_id,
        sender: 'CUSTOMER',
        message: text,
        phone: from,
        message_type: type,
        created_at: timestamp ? new Date(timestamp * 1000) : new Date()
      });
    } catch (error) {
      console.error('Error al guardar mensaje de WhatsApp:', error);
      throw error;
    }
  },

  /**
   * Guarda un mensaje enviado por el sistema
   * @param {string} orderId - ID del pedido
   * @param {string} phone - Número de teléfono
   * @param {string} message - Texto del mensaje
   * @param {string} type - Tipo de mensaje
   * @returns {Promise<Object>} Mensaje guardado
   */
  async saveSystemMessage(orderId, phone, message, type = 'TEXT') {
    try {
      return await this.saveMessage({
        order_id: orderId,
        sender: 'SYSTEM',
        message,
        phone,
        message_type: type
      });
    } catch (error) {
      console.error('Error al guardar mensaje del sistema:', error);
      throw error;
    }
  },

  /**
   * Marca los mensajes como leídos
   * @param {string} orderId - ID del pedido
   * @returns {Promise<Object>} Resultado de la operación
   */
  async markMessagesAsRead(orderId) {
    try {
      const result = await ChatMessage.updateMany(
        { order_id: orderId, is_read: false },
        { $set: { is_read: true } }
      );
      
      return {
        success: true,
        count: result.modifiedCount,
        message: `${result.modifiedCount} mensajes marcados como leídos`
      };
    } catch (error) {
      console.error(`Error al marcar mensajes como leídos para el pedido ${orderId}:`, error);
      throw error;
    }
  }
};

module.exports = chatService; 