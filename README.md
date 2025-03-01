# Innovando Shop - Sistema de Gestión de Pedidos

Sistema para gestionar pedidos de WhatsApp Business, con integración de webhooks para respuestas automáticas y panel de administración.

## Características

- Recepción y procesamiento de mensajes de WhatsApp
- Respuestas automáticas a interacciones con botones
- Panel de administración para gestionar pedidos
- Filtrado de pedidos por estado
- Actualización de estado de pedidos
- Integración con MongoDB para almacenamiento persistente

## Requisitos

- Node.js 14 o superior
- MongoDB
- Cuenta de WhatsApp Business API
- Acceso a Meta for Developers

## Instalación

1. Clona este repositorio:

   ```
   git clone https://github.com/tu-usuario/innovando-wa.git
   cd innovando-wa
   ```

2. Instala las dependencias:

   ```
   npm install
   ```

3. Crea un archivo `.env` basado en `.env.example`:

   ```
   cp .env.example .env
   ```

4. Configura las variables de entorno en el archivo `.env`:
   - `PHONE_NUMBER_ID`: ID de tu número de WhatsApp Business
   - `ACCESS_TOKEN`: Token de acceso de Meta
   - `VERIFY_TOKEN`: Token personalizado para verificar webhooks
   - `MONGODB_URI`: URL de conexión a MongoDB

## Uso

### Desarrollo

```
npm run dev
```

### Producción

```
npm start
```

## Configuración de Webhooks

1. Configura los webhooks en Meta for Developers:

   - URL de webhook: `https://tu-dominio.com/api/button-response`
   - Token de verificación: El mismo valor que configuraste en `VERIFY_TOKEN`
   - Campos a suscribir: `messages`, `message_reactions`

2. Verifica que los webhooks estén funcionando correctamente.

## Estructura del Proyecto

- `server.js`: Punto de entrada de la aplicación
- `routes/api.js`: Rutas de la API y webhooks
- `utils/whatsapp-api.js`: Utilidades para interactuar con la API de WhatsApp
- `views/`: Plantillas EJS para el panel de administración
- `public/`: Archivos estáticos (CSS, JS, imágenes)

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.
