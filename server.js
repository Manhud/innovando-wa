require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');

// Variable para almacenar la conexión
let cachedDb = null;

// Función para conectar a MongoDB
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/innovando_wa';
  
  // Opciones de conexión optimizadas para serverless
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout más corto para la selección del servidor
    socketTimeoutMS: 45000, // Timeout para operaciones de socket
  };
  
  try {
    const client = await mongoose.connect(MONGODB_URI, options);
    console.log('Conectado a MongoDB');
    cachedDb = client;
    return client;
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    throw error;
  }
}

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layout');

// Definir el modelo de Mensaje
const mensajeSchema = new mongoose.Schema({
  contenido: String,
  tipo: {
    type: String,
    enum: ['recibido', 'enviado', 'sistema'],
    default: 'recibido'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Definir el modelo de Pedido
const pedidoSchema = new mongoose.Schema({
  telefono: {
    type: String,
    required: true
  },
  nombre: String,
  productos: [String],
  direccion: String,
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado'],
    default: 'pendiente'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },
  notas: String,
  mensajes: [mensajeSchema]
});

// Middleware para actualizar la fecha de actualización
pedidoSchema.pre('save', function(next) {
  this.fechaActualizacion = Date.now();
  next();
});

const Pedido = mongoose.model('Pedido', pedidoSchema);
const Mensaje = mongoose.model('Mensaje', mensajeSchema);

// Crear un objeto para exportar los modelos
const models = {
  Pedido,
  Mensaje
};

// Exportar los modelos para usarlos en otros archivos
app.locals.models = models;

// Middleware para asegurar la conexión a MongoDB antes de cada solicitud
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    req.models = models;
    next();
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }
});

// Rutas para la API de WhatsApp
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Ruta de verificación rápida para Vercel
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Rutas para la interfaz web
app.get('/', async (req, res) => {
  try {
    const filtro = req.query.estado || '';
    const query = filtro ? { estado: filtro } : {};
    
    const pedidos = await Pedido.find(query).sort({ fechaActualizacion: -1 });
    res.render('index', { 
      pedidos, 
      filtroActual: filtro,
      estados: ['pendiente', 'confirmado']
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).render('error', { error: 'Error al cargar los pedidos' });
  }
});

// Ruta para ver detalles de un pedido
app.get('/pedidos/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).render('error', { error: 'Pedido no encontrado' });
    }
    res.render('detalle', { pedido });
  } catch (error) {
    console.error('Error al obtener detalles del pedido:', error);
    res.status(500).render('error', { error: 'Error al cargar los detalles del pedido' });
  }
});

// Ruta para actualizar el estado de un pedido
app.post('/pedidos/:id/actualizar', async (req, res) => {
  try {
    const { estado, notas } = req.body;
    
    // Crear un mensaje de sistema para registrar el cambio
    const mensajeSistema = {
      contenido: `Estado actualizado a: ${estado}${notas ? ` - Notas: ${notas}` : ''}`,
      tipo: 'sistema',
      timestamp: Date.now()
    };
    
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id, 
      { 
        estado, 
        notas, 
        fechaActualizacion: Date.now(),
        $push: { mensajes: mensajeSistema }
      },
      { new: true }
    );
    
    if (!pedido) {
      return res.status(404).render('error', { error: 'Pedido no encontrado' });
    }
    
    res.redirect('/pedidos/' + req.params.id);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).render('error', { error: 'Error al actualizar el pedido' });
  }
});

// Ruta para crear un nuevo pedido manualmente
app.get('/nuevo-pedido', (req, res) => {
  res.render('nuevo-pedido', { 
    estados: ['pendiente', 'confirmado']
  });
});

app.post('/nuevo-pedido', async (req, res) => {
  try {
    const { telefono, nombre, productos, direccion, estado, notas } = req.body;
    
    // Convertir productos de string a array
    const productosArray = productos.split(',').map(p => p.trim());
    
    const nuevoPedido = new Pedido({
      telefono,
      nombre,
      productos: productosArray,
      direccion,
      estado,
      notas
    });
    
    await nuevoPedido.save();
    res.redirect('/');
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).render('error', { error: 'Error al crear el pedido' });
  }
});

// Si estamos en desarrollo, iniciamos el servidor
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Inicializar la conexión a MongoDB al inicio
connectToDatabase().catch(console.error);

// Exportar la aplicación para Vercel
module.exports = app; 