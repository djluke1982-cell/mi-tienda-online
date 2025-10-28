const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const shortid = require('shortid');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const twilioSid = process.env.TWILIO_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilioFrom = process.env.TWILIO_FROM;
const ownerPhone = process.env.OWNER_PHONE;
let twilioClient = null;
if (twilioSid && twilioToken) {
  const twilio = require('twilio');
  twilioClient = twilio(twilioSid, twilioToken);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, '[]');
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const readJSON = file => JSON.parse(fs.readFileSync(file));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { title, price, description } = req.body;
    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload_stream({ folder: 'tienda_productos' }, (error, result) => {
        if (error) console.error('Error Cloudinary:', error);
        else imageUrl = result.secure_url;
      }).end(req.file.buffer);
    }
    const products = readJSON(PRODUCTS_FILE);
    const newProduct = { id: shortid.generate(), title, price: Number(price || 0), description, image: imageUrl };
    products.push(newProduct);
    writeJSON(PRODUCTS_FILE, products);
    res.json({ ok: true, product: newProduct });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/products', (req, res) => res.json(readJSON(PRODUCTS_FILE)));

app.post('/api/purchase', (req, res) => {
  try {
    const { productId, customerName, customerPhone, deliveryAddress, paymentMethod } = req.body;
    if (!productId || !customerName || !customerPhone)
      return res.status(400).json({ ok: false, error: 'Faltan datos' });

    const products = readJSON(PRODUCTS_FILE);
    const product = products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });

    const orders = readJSON(ORDERS_FILE);
    const order = {
      id: shortid.generate(),
      productId,
      productTitle: product.title,
      customerName,
      customerPhone,
      deliveryAddress: deliveryAddress || '',
      paymentMethod: paymentMethod || 'Contra entrega',
      date: new Date().toISOString()
    };
    orders.push(order);
    writeJSON(ORDERS_FILE, orders);

    const msg = `Nuevo pedido: ${order.productTitle} - Cliente: ${customerName} - Tel: ${customerPhone} - Pago: ${order.paymentMethod} - Dirección: ${order.deliveryAddress}`;
    if (twilioClient && ownerPhone && twilioFrom) {
      twilioClient.messages.create({ body: msg, from: twilioFrom, to: ownerPhone })
        .then(() => console.log('SMS enviado'))
        .catch(err => console.error('Error SMS:', err));
    } else console.log('Twilio no configurado:', msg);

    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => console.log(`Servidor iniciado en http://localhost:${PORT}`));
