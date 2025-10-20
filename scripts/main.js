// Variables globales
let productos = [];
let currentUser = null;
let isEditing = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Cargar sesión desde localStorage si existe
    loadSession();
    
    // Cargar sidebar
    loadSidebar();
    
    // Estado inicial: actualizar UI según sesión
    updateAuthUI();
    
    // Inicial: render
    renderProductos(productos);
});

// Cargar sesión desde localStorage
function loadSession() {
    try {
        const saved = localStorage.getItem('currentUser');
        if (saved) currentUser = JSON.parse(saved);
    } catch (e) { 
        currentUser = null; 
    }
}

// Cargar sidebar
function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = `
            <aside class="sidebar" aria-label="barra lateral">
                <div>
                    <div class="brand">
                        <div class="logo">MC</div>
                        <div>
                            <h2>Mi Catálogo</h2>
                            <div style="font-size:12px;color:rgba(255,255,255,0.75)">Panel administrador</div>
                        </div>
                    </div>
                    <ul>
                        <li onclick="filtrarCategoria('all')">🏠 Inicio</li>
                        <li onclick="filtrarCategoria('ropa')">👕 Ropa</li>
                        <li onclick="filtrarCategoria('electronicos')">💻 Electrónicos</li>
                        <li onclick="filtrarCategoria('hogar')">🏠 Hogar</li>
                        <li onclick="filtrarCategoria('cocina')">🍽 Cocina</li>
                        <li onclick="filtrarCategoria('entretenimiento')">🎮 Entretenimiento</li>
                    </ul>
                </div>
                <div class="bottom">
                    <button id="addProductBtn" title="Agregar producto" disabled>➕ Agregar producto</button>
                </div>
            </aside>
        `;
        
        // Configurar evento del botón después de cargar el sidebar
        setTimeout(() => {
            const addProductBtn = document.getElementById('addProductBtn');
            if (addProductBtn) {
                addProductBtn.addEventListener('click', () => {
                    if (!currentUser || currentUser.role !== 'admin') {
                        alert('Solo administradores pueden agregar productos. Inicia sesión como administrador.');
                        return;
                    }
                    openAddForm();
                });
            }
        }, 100);
    }
}

// Escape simple para evitar inyecciones de HTML
function escapeHtml(str){
    if (!str) return '';
    return String(str)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#39;');
}
