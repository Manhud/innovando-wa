const mongoose = require('mongoose');

/**
 * Esquema para los mensajes de chat asociados a pedidos
 */
const ChatMessageSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['CUSTOMER', 'SYSTEM', 'ADMIN'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    index: true
  },
  message_type: {
    type: String,
    enum: ['TEXT', 'BUTTON', 'LOCATION', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO'],
    default: 'TEXT'
  },
  button_payload: {
    type: String,
    trim: true
  },
  media_url: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  is_read: {
    type: Boolean,
    default: false
  }
});

// Índice compuesto para búsquedas eficientes por pedido y fecha
ChatMessageSchema.index({ order_id: 1, created_at: -1 });

// Crear el modelo
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

module.exports = ChatMessage; 