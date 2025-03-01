const mongoose = require('mongoose');

/**
 * Esquema para los productos dentro de un pedido
 */
const OrderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

/**
 * Esquema para la dirección de envío
 */
const ShippingAddressSchema = new mongoose.Schema({
  address1: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  postal_code: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  }
});

/**
 * Esquema para la información del cliente
 */
const CustomerSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  }
});

/**
 * Esquema principal para los pedidos
 */
const OrderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customer: {
    type: CustomerSchema,
    required: true
  },
  shipping_address: {
    type: ShippingAddressSchema,
    required: true
  },
  line_items: {
    type: [OrderItemSchema],
    required: true
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['CREATED', 'MESSAGE_SENT', 'MESSAGE_FAILED', 'CONFIRMADO', 'CANCELADO', 'MODIFICACION_SOLICITADA', 'CAMBIO_DIRECCION_SOLICITADO', 'RESPUESTA_RECIBIDA'],
    default: 'CREATED'
  },
  message_status: {
    type: String,
    trim: true
  },
  message_id: {
    type: String,
    trim: true
  },
  has_unread_messages: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar la fecha de actualización
OrderSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Crear el modelo
const Order = mongoose.model('Order', OrderSchema);

module.exports = Order; 