const express = require('express');
const router = express.Router();
const { sendTextMessage } = require('../utils/whatsapp-api');
const { Pedido, Mensaje } = require('../server');

// Ruta para el webhook de WhatsApp (mantener la funcionalidad existente)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verificado!');
    return res.status(200).send(challenge);
  }
  return res.status(403).end();
});

router.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));
    
    // Procesar mensajes entrantes
    const data = req.body;
    
    if (data.entry && 
        data.entry[0].changes && 
        data.entry[0].changes[0].value.messages && 
        data.entry[0].changes[0].value.messages.length > 0) {
      
      const message = data.entry[0].changes[0].value.messages[0];
      const from = message.from; // Número del cliente
      
      // Guardar el mensaje recibido
      await guardarMensaje(from, message);
    }
    
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return res.status(200).json({ status: 'error', message: error.message });
  }
});

// Ruta para el webhook de botones
router.get('/button-response', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Button webhook verificado!');
    return res.status(200).send(challenge);
  }
  return res.status(403).end();
});

router.post('/button-response', async (req, res) => {
  try {
    console.log('Button handler recibido:', JSON.stringify(req.body, null, 2));
    
    const data = req.body;
    
    // Verificar si hay mensajes en la solicitud (formato estándar de webhook)
    if (data.entry && 
        data.entry[0].changes && 
        data.entry[0].changes[0].value.messages && 
        data.entry[0].changes[0].value.messages.length > 0) {
      
      const message = data.entry[0].changes[0].value.messages[0];
      const from = message.from; // Número del cliente
      
      console.log('Mensaje recibido de:', from);
      console.log('Tipo de mensaje:', message.type);
      
      // Manejar respuesta de botón directa (formato antiguo)
      if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
        const buttonText = message.interactive.button_reply.title;
        await handleButtonResponse(from, buttonText);
        
        // Guardar el mensaje recibido
        await guardarMensaje(from, message);
      }
      // Manejar el nuevo formato de respuesta de botón
      else if (message.type === 'button') {
        const buttonText = message.button.text;
        await handleButtonResponse(from, buttonText);
        
        // Guardar el mensaje recibido
        await guardarMensaje(from, message);
      }
    } 
    // Manejar formato alternativo de respuesta de botón
    else if (data.type === 'button' && data.from) {
      const from = data.from;
      const buttonText = data.button.text || data.button.payload;
      console.log('Botón presionado (formato alternativo):', buttonText);
      
      // Crear un objeto de mensaje para guardar
      const message = {
        type: 'button',
        button: data.button,
        from: from
      };
      
      await handleButtonResponse(from, buttonText);
      
      // Guardar el mensaje recibido
      await guardarMensaje(from, message);
    } else {
      console.log('Formato de mensaje no reconocido o sin mensajes');
    }
    
    // Siempre responder con 200 OK
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error procesando botones:', error);
    // Aún así respondemos con 200 para que Meta no reintente
    return res.status(200).json({ status: 'ok' });
  }
});

// Función para guardar mensajes en la base de datos
async function guardarMensaje(from, message) {
  try {
    // Buscar si ya existe un pedido para este número
    let pedido = await Pedido.findOne({ telefono: from });
    
    // Si no existe, crear uno nuevo
    if (!pedido) {
      pedido = new Pedido({
        telefono: from,
        estado: 'pendiente'
      });
    }
    
    // Crear el objeto de mensaje
    let contenidoMensaje = '';
    let tipoMensaje = 'recibido';
    
    // Extraer el contenido según el tipo de mensaje
    if (message.type === 'text') {
      contenidoMensaje = message.text.body;
    } 
    else if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
      contenidoMensaje = `Botón: ${message.interactive.button_reply.title}`;
    }
    else if (message.type === 'button') {
      contenidoMensaje = `Botón: ${message.button.text || message.button.payload}`;
    }
    else {
      contenidoMensaje = `Mensaje de tipo: ${message.type}`;
    }
    
    // Crear el mensaje
    const nuevoMensaje = {
      contenido: contenidoMensaje,
      tipo: tipoMensaje,
      timestamp: new Date()
    };
    
    // Añadir el mensaje al pedido
    pedido.mensajes.push(nuevoMensaje);
    
    // Guardar el pedido actualizado
    await pedido.save();
    console.log(`Mensaje guardado para el pedido con teléfono ${from}`);
    
    return pedido;
  } catch (error) {
    console.error('Error al guardar mensaje:', error);
    throw error;
  }
}

// Función para guardar mensajes enviados
async function guardarMensajeEnviado(to, message) {
  try {
    // Buscar si ya existe un pedido para este número
    let pedido = await Pedido.findOne({ telefono: to });
    
    // Si no existe, crear uno nuevo (aunque esto no debería ocurrir normalmente)
    if (!pedido) {
      pedido = new Pedido({
        telefono: to,
        estado: 'pendiente'
      });
    }
    
    // Crear el mensaje
    const nuevoMensaje = {
      contenido: message,
      tipo: 'enviado',
      timestamp: new Date()
    };
    
    // Añadir el mensaje al pedido
    pedido.mensajes.push(nuevoMensaje);
    
    // Guardar el pedido actualizado
    await pedido.save();
    console.log(`Mensaje enviado guardado para el pedido con teléfono ${to}`);
    
    return pedido;
  } catch (error) {
    console.error('Error al guardar mensaje enviado:', error);
    throw error;
  }
}

// Función para manejar respuestas de botones y guardar en la base de datos
async function handleButtonResponse(from, buttonText) {
  try {
    console.log(`Procesando respuesta de botón: "${buttonText}" para el número ${from}`);
    
    // Buscar si ya existe un pedido para este número
    let pedido = await Pedido.findOne({ telefono: from });
    
    // Si no existe, crear uno nuevo
    if (!pedido) {
      pedido = new Pedido({
        telefono: from,
        estado: 'pendiente'
      });
    }
    
    // Responder según el botón presionado
    if (buttonText === 'Confirmar pedido') {
      console.log('Enviando mensaje de confirmación de pedido');
      
      // Actualizar el estado del pedido
      pedido.estado = 'confirmado';
      pedido.fechaActualizacion = Date.now();
      
      // Guardar el pedido en la base de datos
      await pedido.save();
      console.log(`Pedido confirmado en la base de datos: ${pedido._id}`);
      
      const mensaje = "¡Gracias por confirmar tu pedido! 🎉\n\n" +
        "Tu pedido ha sido registrado y será procesado inmediatamente.\n" +
        "Te mantendremos informado sobre el estado de tu envío. 📦\n\n" +
        "¿Necesitas algo más? Estamos aquí para ayudarte. 😊";
      
      await sendTextMessage(from, mensaje);
      
      // Guardar el mensaje enviado
      await guardarMensajeEnviado(from, mensaje);
    } 
    else if (buttonText === 'Modificar pedido') {
      console.log('Enviando mensaje de modificación de pedido');
      
      // Actualizar el estado del pedido si estaba confirmado
      if (pedido.estado === 'confirmado') {
        pedido.estado = 'pendiente';
        pedido.notas = pedido.notas ? pedido.notas + ' - Cliente solicitó modificación' : 'Cliente solicitó modificación';
        pedido.fechaActualizacion = Date.now();
        await pedido.save();
      }
      
      const mensaje = "Entendido, vamos a modificar tu pedido. 📝\n\n" +
        "Por favor, indícanos qué cambios deseas realizar:\n" +
        "- Cantidad\n" +
        "- Producto\n" +
        "- Otro\n\n" +
        "Un asesor te atenderá en breve. 👨‍💼";
      
      await sendTextMessage(from, mensaje);
      
      // Guardar el mensaje enviado
      await guardarMensajeEnviado(from, mensaje);
    } 
    else if (buttonText === 'Modificar datos de envío') {
      console.log('Enviando mensaje de modificación de datos de envío');
      
      // Actualizar notas del pedido
      pedido.notas = pedido.notas ? pedido.notas + ' - Cliente solicitó modificar datos de envío' : 'Cliente solicitó modificar datos de envío';
      pedido.fechaActualizacion = Date.now();
      await pedido.save();
      
      const mensaje = "Vamos a actualizar tus datos de envío. 🏠\n\n" +
        "Por favor, envíanos:\n" +
        "1. Dirección completa\n" +
        "2. Ciudad\n" +
        "3. Nombre del destinatario\n" +
        "4. Teléfono de contacto\n\n" +
        "Un asesor procesará los cambios pronto. ✅";
      
      await sendTextMessage(from, mensaje);
      
      // Guardar el mensaje enviado
      await guardarMensajeEnviado(from, mensaje);
    } else {
      console.log(`Botón no reconocido: "${buttonText}"`);
    }
    console.log('Respuesta de botón procesada exitosamente');
  } catch (error) {
    console.error(`Error al manejar la respuesta del botón "${buttonText}":`, error);
    // No propagamos el error para evitar que falle todo el webhook
  }
}

// API para obtener todos los pedidos (formato JSON)
router.get('/pedidos', async (req, res) => {
  try {
    const filtro = req.query.estado || '';
    const query = filtro ? { estado: filtro } : {};
    
    const pedidos = await Pedido.find(query).sort({ fechaActualizacion: -1 });
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al cargar los pedidos' });
  }
});

// API para obtener un pedido específico
router.get('/pedidos/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    console.error('Error al obtener detalles del pedido:', error);
    res.status(500).json({ error: 'Error al cargar los detalles del pedido' });
  }
});

// API para actualizar un pedido
router.put('/pedidos/:id', async (req, res) => {
  try {
    const { estado, nombre, productos, direccion, notas } = req.body;
    
    const updateData = {
      fechaActualizacion: Date.now()
    };
    
    if (estado) updateData.estado = estado;
    if (nombre) updateData.nombre = nombre;
    if (productos) updateData.productos = Array.isArray(productos) ? productos : productos.split(',').map(p => p.trim());
    if (direccion) updateData.direccion = direccion;
    if (notas) updateData.notas = notas;
    
    // Crear un mensaje de sistema para registrar el cambio
    const mensajeSistema = {
      contenido: `Pedido actualizado vía API: ${JSON.stringify(updateData)}`,
      tipo: 'sistema',
      timestamp: Date.now()
    };
    
    // Añadir el mensaje al pedido
    updateData.$push = { mensajes: mensajeSistema };
    
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true }
    );
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    res.json(pedido);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: 'Error al actualizar el pedido' });
  }
});

module.exports = router; 