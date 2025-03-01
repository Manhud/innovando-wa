# innovando-wa

Servicio webhook para enviar mensajes a los clientes a través de WhatsApp Business API y gestionar pedidos en MongoDB.

## Requisitos previos

- Node.js (versión 14 o superior)
- npm (incluido con Node.js)
- Cuenta de WhatsApp Business API
- Cuenta en MongoDB Atlas (para la base de datos en la nube)

## Configuración

1. Clona este repositorio:

```bash
git clone <url-del-repositorio>
cd innovando-wa
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno:
   - Copia el archivo `.env.example` a `.env`
   - Edita el archivo `.env` y configura las siguientes variables:
     - `PHONE_NUMBER_ID`: ID del número de teléfono de WhatsApp Business
     - `ACCESS_TOKEN`: Token de acceso para la API de WhatsApp
     - `VERIFY_TOKEN`: Token de verificación para el webhook (puedes crear uno propio)
     - `MONGODB_URI`: URI de conexión a MongoDB Atlas (ver instrucciones abajo)

## Configuración de MongoDB Atlas

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) si aún no tienes una.

2. Crea un nuevo cluster:

   - Puedes usar el tier gratuito (M0) para empezar.
   - Selecciona el proveedor de nube y la región más cercana a tu ubicación.
   - Haz clic en "Create Cluster".

3. Configura el acceso a la base de datos:

   - En la sección "Security", haz clic en "Database Access".
   - Haz clic en "Add New Database User".
   - Crea un usuario con contraseña y anota estas credenciales.
   - Asigna permisos de lectura y escritura (role: "readWrite").

4. Configura el acceso a la red:

   - En la sección "Security", haz clic en "Network Access".
   - Haz clic en "Add IP Address".
   - Para desarrollo, puedes permitir el acceso desde cualquier lugar (0.0.0.0/0).
   - Para producción, restringe el acceso a las IPs de tus servidores.

5. Obtén la cadena de conexión:

   - En la página principal del cluster, haz clic en "Connect".
   - Selecciona "Connect your application".
   - Copia la cadena de conexión.
   - Reemplaza `<username>`, `<password>` y `<dbname>` con tus credenciales y el nombre de la base de datos (innovando-wa).

6. Actualiza el archivo `.env` con la cadena de conexión:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/innovando-wa?retryWrites=true&w=majority
```

7. Prueba la conexión:

```bash
npm run test-db
```

## Base de datos

El proyecto utiliza MongoDB para almacenar los pedidos y su estado. Los pedidos pasan por los siguientes estados:

- `CREATED`: Pedido recibido y guardado en la base de datos
- `MESSAGE_SENT`: Mensaje enviado correctamente al cliente por WhatsApp
- `MESSAGE_FAILED`: Error al enviar el mensaje al cliente

Para inicializar la base de datos:

```bash
npm run init-db
```

## Ejecución

### Desarrollo

Para ejecutar el servidor en modo desarrollo con recarga automática:

```bash
npm run dev
```

### Producción

Para ejecutar el servidor en modo producción:

```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000` por defecto, o en el puerto especificado en la variable de entorno `PORT`.

## Endpoints

### Webhooks

- `GET /`: Verificación de que el servidor está funcionando
- `POST /api/webhook`: Endpoint para recibir pedidos, guardarlos en la base de datos y enviar mensajes de WhatsApp
- `POST /api/button-response`: Endpoint para manejar respuestas de botones de WhatsApp

### API de Pedidos

- `GET /api/orders`: Obtener todos los pedidos
- `GET /api/orders/:orderId`: Obtener un pedido específico por su ID

## Despliegue en Vercel

Para desplegar en Vercel:

1. Configura las variables de entorno en Vercel:

   - `MONGODB_URI`: URI de conexión a MongoDB Atlas
   - `PHONE_NUMBER_ID`: ID del número de teléfono de WhatsApp Business
   - `ACCESS_TOKEN`: Token de acceso para la API de WhatsApp
   - `VERIFY_TOKEN`: Token de verificación para el webhook

2. Conecta tu repositorio a Vercel y despliega.

## Pruebas

Para probar el webhook localmente, puedes usar herramientas como ngrok para exponer tu servidor local a Internet.
