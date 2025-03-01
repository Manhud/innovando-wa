const Order = require('../models/Order');

/**
 * Servicio para manejar las operaciones con los pedidos
 */
const orderService = {
  /**
   * Crea un nuevo pedido en la base de datos
   * @param {Object} orderData - Datos del pedido
   * @returns {Promise<Object>} Pedido creado
   */
  async createOrder(orderData) {
    try {
      // Asegurarse de que el pedido tenga un ID único
      if (!orderData.order_id) {
        orderData.order_id = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
      
      // Crear el pedido con estado inicial CREATED
      const order = new Order({
        ...orderData,
        status: 'CREATED'
      });
      
      // Guardar el pedido en la base de datos
      await order.save();
      
      console.log(`Pedido creado con ID: ${order.order_id}`);
      return order;
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      throw error;
    }
  },
  
  /**
   * Actualiza el estado de un pedido después de enviar el mensaje
   * @param {string} orderId - ID del pedido
   * @param {boolean} messageSent - Indica si el mensaje se envió correctamente
   * @param {Object} messageDetails - Detalles del mensaje enviado
   * @returns {Promise<Object>} Pedido actualizado
   */
  async updateOrderMessageStatus(orderId, messageSent, messageDetails = {}) {
    try {
      // Buscar el pedido por ID
      const order = await Order.findOne({ order_id: orderId });
      
      if (!order) {
        throw new Error(`Pedido con ID ${orderId} no encontrado`);
      }
      
      // Actualizar el estado según el resultado del envío
      if (messageSent) {
        order.status = 'MESSAGE_SENT';
        order.message_status = 'sent';
        order.message_id = messageDetails.id || null;
      } else {
        order.status = 'MESSAGE_FAILED';
        order.message_status = messageDetails.error || 'failed';
      }
      
      // Guardar los cambios
      await order.save();
      
      console.log(`Estado del pedido ${orderId} actualizado a: ${order.status}`);
      return order;
    } catch (error) {
      console.error(`Error al actualizar el estado del pedido ${orderId}:`, error);
      throw error;
    }
  },
  
  /**
   * Obtiene un pedido por su ID
   * @param {string} orderId - ID del pedido
   * @returns {Promise<Object>} Pedido encontrado
   */
  async getOrderById(orderId) {
    try {
      const order = await Order.findOne({ order_id: orderId });
      return order;
    } catch (error) {
      console.error(`Error al obtener el pedido ${orderId}:`, error);
      throw error;
    }
  },
  
  /**
   * Obtiene todos los pedidos con filtros opcionales
   * @param {Object} filters - Filtros para la consulta
   * @returns {Promise<Array>} Lista de pedidos
   */
  async getAllOrders(filters = {}) {
    try {
      const orders = await Order.find(filters).sort({ created_at: -1 });
      return orders;
    } catch (error) {
      console.error('Error al obtener los pedidos:', error);
      throw error;
    }
  }
};

module.exports = orderService; 