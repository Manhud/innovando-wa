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
   * Actualiza el estado de un pedido
   * @param {string} orderId - ID del pedido
   * @param {string} newStatus - Nuevo estado del pedido
   * @param {Object} additionalData - Datos adicionales para actualizar
   * @returns {Promise<Object>} Pedido actualizado
   */
  async updateOrderStatus(orderId, newStatus, additionalData = {}) {
    try {
      // Buscar el pedido por ID
      const order = await Order.findOne({ order_id: orderId });
      
      if (!order) {
        throw new Error(`Pedido con ID ${orderId} no encontrado`);
      }
      
      // Actualizar el estado
      order.status = newStatus;
      
      // Actualizar datos adicionales si se proporcionan
      for (const [key, value] of Object.entries(additionalData)) {
        order[key] = value;
      }
      
      // Guardar los cambios
      await order.save();
      
      console.log(`Estado del pedido ${orderId} actualizado a: ${newStatus}`);
      return order;
    } catch (error) {
      console.error(`Error al actualizar el estado del pedido ${orderId}:`, error);
      throw error;
    }
  },
  
  /**
   * Obtiene los pedidos asociados a un número de teléfono
   * @param {string} phone - Número de teléfono
   * @param {Object} options - Opciones adicionales (limit, sort)
   * @returns {Promise<Array>} Lista de pedidos
   */
  async getOrdersByPhone(phone, options = {}) {
    try {
      // Validar que el teléfono no sea nulo
      if (!phone) {
        console.log('Número de teléfono no proporcionado');
        return [];
      }
      
      // Limpiar el número de teléfono para la búsqueda
      const cleanPhone = phone.toString().replace(/\D/g, '');
      console.log(`Buscando pedidos para el teléfono: "${phone}" (limpio: "${cleanPhone}")`);
      
      // Crear patrones para buscar diferentes formatos del número
      const patterns = [
        // Patrón 1: Exactamente igual al número proporcionado
        new RegExp(`^${phone}$`),
        
        // Patrón 2: Exactamente igual al número limpio
        new RegExp(`^${cleanPhone}$`),
        
        // Patrón 3: Contiene el número limpio
        new RegExp(cleanPhone),
        
        // Patrón 4: Con el prefijo 57
        new RegExp(`57${cleanPhone}`),
      ];
      
      // Patrón 5: Con el formato +57
      if (!cleanPhone.startsWith('57')) {
        patterns.push(new RegExp(`\\+57${cleanPhone}`));
      } else {
        patterns.push(new RegExp(`\\+${cleanPhone}`));
      }
      
      // Patrón 6: Búsqueda parcial (contiene el número)
      patterns.push(new RegExp(cleanPhone));
      
      // Construir la consulta con OR para cualquiera de los patrones
      const query = {
        $or: [
          ...patterns.map(pattern => ({ 'customer.phone': { $regex: pattern } })),
          // También buscar pedidos donde el teléfono sea exactamente igual al proporcionado
          { 'customer.phone': phone }
        ]
      };
      
      console.log(`Patrones de búsqueda: ${patterns.map(p => p.toString())}`);
      
      // Aplicar opciones adicionales
      const limit = options.limit || 10;
      const sort = options.sort || { created_at: -1 }; // Por defecto, ordenar por fecha de creación descendente
      
      const orders = await Order.find(query)
        .sort(sort)
        .limit(limit);
      
      console.log(`Se encontraron ${orders.length} pedidos para el teléfono ${phone}`);
      
      // Registrar los IDs de los pedidos encontrados para depuración
      if (orders.length > 0) {
        console.log('Pedidos encontrados:');
        orders.forEach((order, index) => {
          console.log(`${index + 1}. ID: ${order.order_id}, Estado: ${order.status}, Teléfono: "${order.customer.phone}"`);
        });
      } else {
        console.log('No se encontraron pedidos para este número de teléfono');
        
        // Búsqueda alternativa: mostrar todos los pedidos recientes para depuración
        console.log('Mostrando pedidos recientes para depuración:');
        const recentOrders = await Order.find()
          .sort({ created_at: -1 })
          .limit(5);
        
        if (recentOrders.length > 0) {
          recentOrders.forEach((order, index) => {
            console.log(`${index + 1}. ID: ${order.order_id}, Teléfono: "${order.customer.phone}", Estado: ${order.status}`);
          });
        } else {
          console.log('No hay pedidos recientes en la base de datos');
        }
      }
      
      return orders;
    } catch (error) {
      console.error(`Error al buscar pedidos por teléfono ${phone}:`, error);
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
  },
  
  /**
   * Elimina un pedido de la base de datos
   * @param {string} orderId - ID del pedido a eliminar
   * @returns {Promise<Object>} Resultado de la operación
   */
  async deleteOrder(orderId) {
    try {
      // Verificar que el pedido existe antes de eliminarlo
      const order = await Order.findOne({ order_id: orderId });
      
      if (!order) {
        throw new Error(`Pedido con ID ${orderId} no encontrado`);
      }
      
      // Guardar información del pedido para el registro
      const orderInfo = {
        id: order.order_id,
        customer: order.customer,
        status: order.status,
        created_at: order.created_at
      };
      
      // Eliminar el pedido
      const result = await Order.deleteOne({ order_id: orderId });
      
      if (result.deletedCount === 1) {
        console.log(`Pedido ${orderId} eliminado correctamente`);
        return { 
          success: true, 
          message: `Pedido ${orderId} eliminado correctamente`,
          deletedOrder: orderInfo
        };
      } else {
        throw new Error(`No se pudo eliminar el pedido ${orderId}`);
      }
    } catch (error) {
      console.error(`Error al eliminar el pedido ${orderId}:`, error);
      throw error;
    }
  }
};

module.exports = orderService; 