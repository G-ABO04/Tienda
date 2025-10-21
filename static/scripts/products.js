// products.js — conecta UI con API Flask (SQLite)
let overlay, formContainer, cancelarBtn, guardarBtn, productsGrid, totalProducts, formTitle, productIdField;

// Si despliegas el backend en la nube, cambia API_BASE por esa URL
const API_BASE = '';

document.addEventListener('DOMContentLoaded', function () {
  overlay = document.getElementById('overlay');
  formContainer = document.getElementById('formContainer');
  cancelarBtn = document.getElementById('cancelarBtn');
  guardarBtn = document.getElementById('guardarBtn');
  productsGrid = document.getElementById('productsGrid');
  totalProducts = document.getElementById('totalProducts');
  formTitle = document.getElementById('formTitle');
  productIdField = document.getElementById('productId');

  setupProductEvents();
  fetchProductos();
});

function setupProductEvents() {
  cancelarBtn?.addEventListener('click', cerrarFormulario);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) cerrarFormulario(); });
  guardarBtn?.addEventListener('click', guardarProducto);
}

function openAddForm() {
  isEditing = false;
  if (formTitle) formTitle.textContent = 'Agregar producto';
  if (productIdField) productIdField.value = '';
  setFormValues({ nombre: '', precio: '', imagen: '', descripcion: '', categoria: 'general' });
  showOverlay();
}

function openEditForm(productId) {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Solo administradores pueden editar productos.');
    return;
  }
  const product = productos.find(p => p.id === productId);
  if (!product) return;

  isEditing = true;
  if (formTitle) formTitle.textContent = 'Editar producto';
  if (productIdField) productIdField.value = product.id;
  setFormValues(product);
  showOverlay();
}

function deleteProduct(productId) {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Solo administradores pueden eliminar productos.');
    return;
  }
  if (!confirm('¿Eliminar este producto?')) return;

  fetch(`${API_BASE}/api/productos/${productId}`, { method: 'DELETE' })
    .then(r => r.json()).then(d => {
      if (!d.ok) return alert(d.msg || 'Error eliminando');
      productos = productos.filter(p => p.id !== productId);
      renderProductos(productos);
      actualizarTotal();
    }).catch(() => alert('No se pudo conectar al servidor'));
}

function cerrarFormulario() {
  if (overlay) {
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
  }
  formContainer?.reset?.();
  setFormValues({ nombre: '', precio: '', imagen: '', descripcion: '', categoria: 'general' });
}

function showOverlay() {
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
  }
  setTimeout(() => {
    const el = document.getElementById('productName') || document.getElementById('nombre');
    if (el) el.focus();
  }, 60);
}

// Helpers para formulario (IDs compatibles con tu HTML)
function getFormValues() {
  const nombre = (byId('productName') || byId('nombre'))?.value.trim() || '';
  const precioRaw = (byId('productPrice') || byId('precio'))?.value;
  const imagen = (byId('productImage') || byId('imagen'))?.value.trim() || '';
  const descripcion = byId('descripcion')?.value.trim() || '';
  const categoria = (byId('productCategory') || byId('categoria'))?.value.trim() || 'general';
  return { nombre, precioRaw, imagen, descripcion, categoria };
}
function setFormValues(p) {
  setVal('productName','nombre', p.nombre || '');
  setVal('productPrice','precio', p.precio || '');
  setVal('productImage','imagen', p.imagen || '');
  setVal('descripcion','descripcion', p.descripcion || '');
  setVal('productCategory','categoria', p.categoria || 'general');
}
function setVal(idA, idB, val) {
  const a = byId(idA); const b = byId(idB);
  if (a) a.value = val;
  if (b) b.value = val;
}
function byId(id){ return document.getElementById(id); }

async function fetchProductos() {
  try {
    const r = await fetch(`${API_BASE}/api/productos`);
    const d = await r.json();
    if (!d.ok) throw new Error(d.msg || 'Error listando');
    productos = d.items || [];
    renderProductos(productos);
    actualizarTotal();
  } catch (e) {
    console.error(e);
    alert('No se pudo obtener la lista de productos');
  }
}

async function guardarProducto() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Acceso denegado. Debes ser administrador para guardar productos.');
    cerrarFormulario();
    return;
  }

  const { nombre, precioRaw, imagen, descripcion, categoria } = getFormValues();
  if (!nombre || !precioRaw) {
    alert('Completa nombre y precio.');
    return;
  }

  let precio = parseFloat(precioRaw);
  if (isNaN(precio) || precio < 0) {
    alert('Precio inválido.');
    return;
  }

  const payload = {
    nombre,
    precio,
    imagen: imagen || 'https://via.placeholder.com/400x240?text=Sin+imagen',
    descripcion,
    categoria: (categoria || 'general').toLowerCase()
  };

  try {
    if (isEditing) {
      const id = parseInt(productIdField.value);
      const r = await fetch(`${API_BASE}/api/productos/${id}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.msg || 'Error actualizando');

      const ix = productos.findIndex(p => p.id === id);
      if (ix !== -1) productos[ix] = { ...productos[ix], ...payload };
    } else {
      const r = await fetch(`${API_BASE}/api/productos`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.msg || 'Error guardando');
      productos.unshift({ id: d.id, ...payload });
    }

    renderProductos(productos);
    actualizarTotal();
    cerrarFormulario();
  } catch (e) {
    console.error(e);
    alert(e.message || 'No se pudo guardar');
  }
}

function renderProductos(list) {
  if (!productsGrid) return;
  productsGrid.innerHTML = '';
  const data = list && list.length ? list : [];

  if (!data.length) {
    productsGrid.innerHTML = '<div style="color:#6b7888">No hay productos todavía. Usa "Agregar producto".</div>';
    return;
  }

  data.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-categoria', p.categoria || 'general');
    card.innerHTML = `
      <img src="${escapeHtml(p.imagen || 'https://via.placeholder.com/400x240?text=Sin+imagen')}" alt="${escapeHtml(p.nombre)}">
      <div class="info">
        <div class="name">${escapeHtml(p.nombre)}</div>
        <div class="price">$${Number(p.precio).toFixed(2)}</div>
      </div>
      <div class="desc">${escapeHtml(p.descripcion || '')}</div>
      ${currentUser && currentUser.role === 'admin' ? `
        <div class="product-actions">
          <button class="edit-btn" title="Editar">✏</button>
          <button class="delete-btn" title="Eliminar">🗑</button>
        </div>
      ` : ''}
    `;
    const editBtn = card.querySelector('.edit-btn');
    const delBtn  = card.querySelector('.delete-btn');
    if (editBtn) editBtn.addEventListener('click', () => openEditForm(p.id));
    if (delBtn)  delBtn.addEventListener('click', () => deleteProduct(p.id));
    productsGrid.appendChild(card);
  });
}

function actualizarTotal() {
  if (!totalProducts) return;
  const n = productos.length || 0;
  totalProducts.innerText = `${n} producto${n === 1 ? '' : 's'}`;
}

// util de main.js si no existe en tu versión
function escapeHtml(str){
  if (!str) return '';
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}
