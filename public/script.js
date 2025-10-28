let carrito = [];

async function cargarProductos() {
  const res = await fetch('/api/productos');
  const productos = await res.json();
  const contenedor = document.getElementById('productos');
  contenedor.innerHTML = productos.map(p => `
    <div>
      <img src="${p.imagen}" width="120"><br>
      ${p.nombre} - $${p.precio}<br>
      <button onclick="agregar(${p.id})">Agregar</button>
    </div>
  `).join('');
}

function agregar(id) {
  carrito.push(id);
  mostrarCarrito();
}

function mostrarCarrito() {
  const lista = document.getElementById('carrito');
  lista.innerHTML = carrito.map(i => `<li>${i}</li>`).join('');
}

async function realizarPedido() {
  const cliente = prompt('Tu nombre:');
  const telefono = prompt('Tu teléfono:');
  const direccion = prompt('Tu dirección:');
  await fetch('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente, telefono, direccion, carrito })
  });
  alert('Pedido enviado (pago a domicilio)');
  carrito = [];
  mostrarCarrito();
}

cargarProductos();
