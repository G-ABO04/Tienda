// Referencias de productos
let overlay, formContainer, cancelarBtn, guardarBtn, productsGrid, totalProducts, formTitle, productIdField;

// Inicializar productos
document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias después de que el DOM esté cargado
    overlay = document.getElementById('overlay');
    formContainer = document.getElementById('formContainer');
    cancelarBtn = document.getElementById('cancelarBtn');
    guardarBtn = document.getElementById('guardarBtn');
    productsGrid = document.getElementById('productsGrid');
    totalProducts = document.getElementById('totalProducts');
    formTitle = document.getElementById('formTitle');
    productIdField = document.getElementById('productId');
    
    // Configurar eventos de productos
    setupProductEvents();
});

function setupProductEvents() {
    // Cancelar formulario
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', cerrarFormulario);
    }
    
    // Overlay click
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cerrarFormulario();
        });
    }
    
    // Guardar producto
    if (guardarBtn) {
        guardarBtn.addEventListener('click', guardarProducto);
    }
}

// Abrir formulario para agregar
function openAddForm(){
    isEditing = false;
    if (formTitle) formTitle.textContent = 'Agregar nuevo producto';
    if (productIdField) productIdField.value = '';
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
    }
    setTimeout(()=> {
        const nombreInput = document.getElementById('nombre');
        if (nombreInput) nombreInput.focus();
    }, 80);
}

// Abrir formulario para editar
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
    
    document.getElementById('nombre').value = product.nombre;
    document.getElementById('precio').value = product.precio;
    document.getElementById('imagen').value = product.imagen;
    document.getElementById('descripcion').value = product.descripcion || '';
    document.getElementById('categoria').value = product.categoria;
    
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
    }
    
    setTimeout(()=> {
        const nombreInput = document.getElementById('nombre');
        if (nombreInput) nombreInput.focus();
    }, 80);
}

// Eliminar producto
function deleteProduct(productId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Solo administradores pueden eliminar productos.');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        productos = productos.filter(p => p.id !== productId);
        renderProductos(productos);
    }
}

// Cerrar formulario
function cerrarFormulario(){
    if (overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    }
    if (formContainer) formContainer.reset();
    
    // Limpiar campos específicos
    const fields = ['nombre', 'precio', 'imagen', 'descripcion', 'categoria'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.value = '';
    });
}

// Guardar producto
function guardarProducto() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Acceso denegado. Debes ser administrador para guardar productos.');
        cerrarFormulario();
        return;
    }

    const nombre = document.getElementById('nombre').value.trim();
    const precio = document.getElementById('precio').value;
    const imagen = document.getElementById('imagen').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const categoria = document.getElementById('categoria').value.trim() || 'general';

    if (!nombre || !precio){
        alert('Por favor completa los campos obligatorios: nombre y precio.');
        return;
    }

    if (isEditing) {
        // Editar producto existente
        const productId = parseInt(productIdField.value);
        const index = productos.findIndex(p => p.id === productId);
        
        if (index !== -1) {
            productos[index] = {
                ...productos[index],
                nombre,
                precio: parseFloat(precio).toFixed(2),
                imagen: imagen || 'https://via.placeholder.com/400x240?text=Sin+imagen',
                descripcion,
                categoria: categoria.toLowerCase()
            };
        }
    } else {
        // Crear nuevo producto
        const producto = {
            id: Date.now(),
            nombre,
            precio: parseFloat(precio).toFixed(2),
            imagen: imagen || 'https://via.placeholder.com/400x240?text=Sin+imagen',
            descripcion,
            categoria: categoria.toLowerCase()
        };

        productos.unshift(producto); // agregar al inicio
    }
    
    renderProductos(productos);
    cerrarFormulario();
}

// Renderizar tarjetas de productos
function renderProductos(list){
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    if (!list || list.length === 0) {
        productsGrid.innerHTML = '<div style="color:#6b7888">No hay productos todavía. Usa "Agregar producto" para crear uno.</div>';
        if (totalProducts) totalProducts.innerText = '0 productos';
        return;
    }

    list.forEach(p => {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.setAttribute('data-categoria', p.categoria);

        card.innerHTML = `
            <img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}">
            <div class="info">
                <div class="name">${escapeHtml(p.nombre)}</div>
                <div class="price">$${escapeHtml(p.precio)}</div>
            </div>
            <div class="desc">${escapeHtml(p.descripcion || '')}</div>
            ${currentUser && currentUser.role === 'admin' ? `
                <div class="product-actions">
                    <button class="edit-btn" onclick="openEditForm(${p.id})" title="Editar">✏</button>
                    <button class="delete-btn" onclick="deleteProduct(${p.id})" title="Eliminar">🗑</button>
                </div>
            ` : ''}
        `;
        productsGrid.appendChild(card);
    });

    if (totalProducts) {
        totalProducts.innerText = ${list.length} producto${list.length === 1 ? '' : 's'};
    }
}

// Filtrar por categoria (click en sidebar)
function filtrarCategoria(cat){
    if (cat === 'all') {
        renderProductos(productos);
        return;
    }
    const filtrados = productos.filter(p => p.categoria === cat);
    renderProductos(filtrados.length ? filtrados : []);
}
