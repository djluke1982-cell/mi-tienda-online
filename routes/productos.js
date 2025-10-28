const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

module.exports = (productos, cloudinary) => {
  const router = express.Router();

  router.get('/', (req, res) => res.json(productos));

  router.post('/', upload.single('imagen'), async (req, res) => {
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

  return router;
};
