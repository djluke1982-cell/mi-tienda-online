// server.js
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const twilio = require('twilio');
const path = require('path');

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Configuración Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración Twilio (opcional)
let client = null;
if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
  client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
}

// Base de datos simple en memoria
let productos = [];
let pedidos = [];

// Subida de imágenes con multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rutas de productos
const productosRouter = express.Router();
productosRouter.get('/', (req, res) => res.json(productos));

productosRouter.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) return res.status(500).json({ error });
        const nuevo = {
          id: Date.now(),
          nombre: req.body.nombre,
          precio: req.body.precio,
          imagen: result.secure_url
        };
        productos.push(nuevo);
        res.json(nuevo);
      }
    );
    uploadStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: 'Error al subir producto' });
  }
});

// Rutas de pedidos
const pedidosRouter = express.Router();
pedidosRouter.get('/', (req, res) => res.json(pedidos));

pedidosRouter.post('/', (req, res) => {
  const pedido = {
    id: Date.now(),
    cliente: req.body.cliente,
    telefono: req.body.telefono,
    direccion: req.body.direccion,
    carrito: req.body.carrito
  };
  pedidos.push(pedido);

  // Enviar SMS si Twilio está configurado
  if (client && process.env.OWNER_PHONE) {
    client.messages.create({
      body: `Nuevo pedido de ${pedido.cliente} (${pedido.telefono})`,
      from: process.env.TWILIO_FROM,
      to: process.env.OWNER_PHONE
    }).catch(console.error);
  }

  res.json({ ok: true });
});

// Usar rutas
app.use('/api/productos', productosRouter);
app.use('/api/pedidos', pedidosRouter);

// Panel de administración (sin contraseña)
app.get('/panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'panel.html'));
});

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Iniciar servidor
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor iniciado en puerto ${port}`));
