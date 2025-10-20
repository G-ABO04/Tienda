// cart.js
(() => {
  'use strict';

  // Helpers
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const formatCurrency = (v) => {
    const n = Number(v) || 0;
    return `$${n.toFixed(2)}`;
  };
  const makeId = (name, price) => {
    // stable id based on name+price
    try { return btoa(`${name}||${price}`); } catch { return `${name}-${price}`; }
  };

  // Storage
  const KEY = 'mi_catalogo_cart_v1';
  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  };
  const saveCart = (c) => localStorage.setItem(KEY, JSON.stringify(c));

  let cart = loadCart();

  // DOM refs
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return; // nothing to attach to

  // Create cart UI (floating button + drawer)
  const style = document.createElement('style');
  style.textContent = `
    .mc-cart-toggle {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2000;
      background: #1b4f91;
      color: #fff;
      border: none;
      padding: 12px 14px;
      border-radius: 999px;
      box-shadow: 0 6px 18px rgba(11,35,80,0.25);
      cursor: pointer;
      font-weight:700;
    }
    .mc-cart-drawer {
      position: fixed;
      right: 18px;
      bottom: 72px;
      width: 340px;
      max-height: 70vh;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(10,30,60,0.18);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform-origin: bottom right;
      z-index: 2000;
    }
    .mc-cart-header{ padding:12px 14px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #eee; font-weight:700; color:#0a2340;}
    .mc-cart-list{ padding:10px; overflow:auto; flex:1; min-height:40px; }
    .mc-cart-item{ display:flex; gap:10px; align-items:center; padding:8px 6px; border-radius:8px; }
    .mc-cart-item img{ width:56px; height:44px; object-fit:cover; border-radius:6px; background:#f4f6f8; }
    .mc-cart-item .meta{ flex:1; font-size:13px; color:#223; }
    .mc-cart-item .meta .name{ font-weight:600; margin-bottom:4px; }
    .mc-cart-item .meta .qty{ font-size:12px; color:#667; }
    .mc-cart-item .actions{ display:flex; flex-direction:column; gap:6px; align-items:flex-end; }
    .mc-cart-item button{ background:#f3f4f6; border:none; padding:6px 8px; border-radius:8px; cursor:pointer; font-size:12px; }
    .mc-cart-footer{ padding:10px; border-top:1px solid #eee; display:flex; gap:8px; align-items:center; }
    .mc-cart-footer .total{ font-weight:800; color:#1b4f91; flex:1; }
    .mc-cart-footer button{ padding:8px 10px; border-radius:8px; border:none; cursor:pointer; }
    .mc-clear-btn{ background:#eee; color:#222; }
    .mc-checkout-btn{ background:#1b4f91; color:#fff; }
    .add-to-cart { margin-top:8px; background:#1b4f91; color:#fff; border:none; padding:8px 10px; border-radius:8px; cursor:pointer; font-weight:600; font-size:13px; }
  `;
  document.head.appendChild(style);

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'mc-cart-toggle';
  toggleBtn.title = 'Ver carrito';
  toggleBtn.innerText = `🛒 ${cart.reduce((s,i)=> s + (i.cantidad||0),0) || 0}`;
  document.body.appendChild(toggleBtn);

  const drawer = document.createElement('div');
  drawer.className = 'mc-cart-drawer';
  drawer.style.display = 'none';
  drawer.innerHTML = `
    <div class="mc-cart-header">
      <div>Carrito</div>
      <div id="mcCartCount" style="font-size:13px;color:#667">${cart.length} artículo(s)</div>
    </div>
    <div class="mc-cart-list" id="mcCartList"></div>
    <div class="mc-cart-footer">
      <div class="total" id="mcCartTotal">$0.00</div>
      <button class="mc-clear-btn" id="mcClear">Vaciar</button>
      <button class="mc-checkout-btn" id="mcCheckout">Pagar</button>
    </div>
  `;
  document.body.appendChild(drawer);

  const mcCartList = qs('#mcCartList', drawer);
  const mcCartTotal = qs('#mcCartTotal', drawer);
  const mcCartCount = qs('#mcCartCount', drawer);
  const mcClear = qs('#mcClear', drawer);
  const mcCheckout = qs('#mcCheckout', drawer);

  // Render cart UI
  function renderCart() {
    mcCartList.innerHTML = '';
    if (!cart.length) {
      mcCartList.innerHTML = `<div style="color:#667;padding:8px">El carrito está vacío.</div>`;
    } else {
      cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'mc-cart-item';
        row.dataset.id = item.id;
        row.innerHTML = `
          <img src="${escapeHtml(item.imagen||'')}" alt="${escapeHtml(item.nombre||'')}">
          <div class="meta">
            <div class="name">${escapeHtml(item.nombre)}</div>
            <div class="qty">${item.cantidad} × ${formatCurrency(item.precio)}</div>
          </div>
          <div class="actions">
            <button class="mc-decr" title="Reducir">−</button>
            <button class="mc-incr" title="Aumentar">+</button>
            <button class="mc-remove" title="Eliminar">Eliminar</button>
          </div>
        `;
        mcCartList.appendChild(row);
      });
    }

    const total = cart.reduce((s,i) => s + (Number(i.precio) || 0) * (i.cantidad || 1), 0);
    mcCartTotal.innerText = formatCurrency(total);
    mcCartCount.innerText = `${cart.reduce((s,i)=> s + (i.cantidad||0),0)} artículo(s)`;
    toggleBtn.innerText = `🛒 ${cart.reduce((s,i)=> s + (i.cantidad||0),0) || 0}`;
    saveCart(cart);
  }

  // Escape helper (similar to index.html)
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#39;');
  }

  // Cart operations
  function addToCartFromCard(card) {
    const nameEl = qs('.name', card);
    const priceEl = qs('.price', card);
    const imgEl = qs('img', card);
    const nombre = nameEl?.textContent?.trim() || 'Producto';
    const precioText = (priceEl?.textContent || '').replace(/[^\d.,\-]/g, '').replace(',', '.').trim();
    const precio = Number(precioText) || 0;
    const imagen = imgEl?.src || '';

    const id = makeId(nombre, precio);
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.cantidad = (existing.cantidad || 1) + 1;
    } else {
      cart.push({ id, nombre, precio: Number(precio).toFixed(2), cantidad: 1, imagen });
    }
    renderCart();
  }

  function changeQty(id, delta) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx === -1) return;
    cart[idx].cantidad = Math.max(0, (cart[idx].cantidad || 1) + delta);
    if (cart[idx].cantidad === 0) cart.splice(idx, 1);
    renderCart();
  }

  function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    renderCart();
  }

  // Event delegation for product grid (Add to cart button)
  productsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const card = btn.closest('.product-card');
    if (!card) return;
    addToCartFromCard(card);
  });

  // Event delegation for cart drawer
  mcCartList.addEventListener('click', (e) => {
    const item = e.target.closest('.mc-cart-item');
    if (!item) return;
    const id = item.dataset.id;
    if (e.target.classList.contains('mc-remove')) {
      removeItem(id);
      return;
    }
    if (e.target.classList.contains('mc-incr')) {
      changeQty(id, +1);
      return;
    }
    if (e.target.classList.contains('mc-decr')) {
      changeQty(id, -1);
      return;
    }
  });

  // Toggle drawer
  let open = false;
  function setOpen(val) {
    open = !!val;
    drawer.style.display = open ? 'flex' : 'none';
    toggleBtn.setAttribute('aria-pressed', String(open));
  }
  toggleBtn.addEventListener('click', () => setOpen(!open));

  // Clear / checkout
  mcClear.addEventListener('click', () => {
    cart = [];
    renderCart();
  });
  mcCheckout.addEventListener('click', () => {
    if (!cart.length) { alert('El carrito está vacío.'); return; }
    // demo checkout
    alert(`Ejemplo demo: total ${mcCartTotal.innerText}. Implementa tu flujo de pago en el backend.`);
    // optionally clear
    // cart = []; renderCart();
  });

  // Ensure product cards have "Agregar al carrito" buttons.
  function ensureAddButtons() {
    qsa('.product-card', productsGrid).forEach(card => {
      if (!qs('.add-to-cart', card)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'add-to-cart';
        btn.innerText = '➕ Agregar';
        // append to card (prefer at end)
        card.appendChild(btn);
      }
    });
  }

  // Use MutationObserver to react to dynamic product renders
  const mo = new MutationObserver((mut) => {
    // Whenever product cards are added/updated ensure buttons exist
    ensureAddButtons();
  });
  mo.observe(productsGrid, { childList: true, subtree: true });

  // Initial setup
  ensureAddButtons();
  renderCart();

  // Expose minimal API for other scripts if needed
  window.MiCatalogoCart = {
    addByProductCardElement: (cardEl) => addToCartFromCard(cardEl),
    getCart: () => JSON.parse(JSON.stringify(cart)),
    clear: () => { cart = []; renderCart(); },
  };

})();
