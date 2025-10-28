const express = require('express');

module.exports = (pedidos, productos, client) => {
  const router = express.Router();

  router.get('/', (req, res) => res.json(pedidos));

  router.post('/', (req, res) => {
    const pedido = {
      id: Date.now(),
      cliente: req.body.cliente,
      telefono: req.body.telefono,
      direccion: req.body.direccion,
      carrito: req.body.carrito
    };
    pedidos.push(pedido);

    if (client && process.env.OWNER_PHONE) {
      client.messages.create({
        body: `Nuevo pedido de ${pedido.cliente} (${pedido.telefono})`,
        from: process.env.TWILIO_FROM,
        to: process.env.OWNER_PHONE
      }).catch(console.error);
    }
    res.json({ ok: true });
  });

  return router;
};
