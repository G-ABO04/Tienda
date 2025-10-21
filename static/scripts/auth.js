// Referencias de autenticación
let loginBtn, userArea, loginOverlay, loginForm, loginSubmit, loginCancel, loginEmail, loginPassword;

// Inicializar autenticación
document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias después de que el DOM esté cargado
    loginBtn = document.getElementById('loginBtn');
    userArea = document.getElementById('userArea');
    loginOverlay = document.getElementById('loginOverlay');
    loginForm = document.getElementById('loginForm');
    loginSubmit = document.getElementById('loginSubmit');
    loginCancel = document.getElementById('loginCancel');
    loginEmail = document.getElementById('loginEmail');
    loginPassword = document.getElementById('loginPassword');
    
    // Configurar eventos de autenticación
    setupAuthEvents();
});

function setupAuthEvents() {
    // Login button
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (loginOverlay) {
                loginOverlay.style.display = 'flex';
                loginOverlay.setAttribute('aria-hidden', 'false');
            }
        });
    }
    
    // Login cancel
    if (loginCancel) {
        loginCancel.addEventListener('click', () => {
            if (loginOverlay) {
                loginOverlay.style.display = 'none';
                loginOverlay.setAttribute('aria-hidden', 'true');
                if (loginForm) loginForm.reset();
            }
        });
    }
    
    // Login overlay click
    if (loginOverlay) {
        loginOverlay.addEventListener('click', (e) => {
            if (e.target === loginOverlay) {
                loginOverlay.style.display = 'none';
                loginOverlay.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    // Login submit
    if (loginSubmit) {
        loginSubmit.addEventListener('click', handleLogin);
    }
}

// Validar dominio de correo para administradores
function isValidAdminEmail(email) {
    return email.toLowerCase().endsWith('@tecmilenio.mx');
}

// Manejar login
function handleLogin() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    if (!email || !password) {
        alert('Por favor ingresa correo y contraseña.');
        return;
    }
    
    // Validar si es admin basado en el dominio del correo
    const isAdmin = isValidAdminEmail(email);
    const role = isAdmin ? 'admin' : 'user';
    
    // PERMITIR LOGIN TANTO PARA ADMIN COMO PARA USUARIOS NORMALES
    currentUser = { 
        name: email.split('@')[0], 
        email: email,
        role: role 
    };
    
    // guardar sesión
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    if (loginOverlay) {
        loginOverlay.style.display = 'none';
        loginOverlay.setAttribute('aria-hidden', 'true');
        if (loginForm) loginForm.reset();
    }
    
    updateAuthUI();
    
    // Mostrar mensaje según el rol
    if (isAdmin) {
        alert('Bienvenido administrador');
    } else {
        alert('Bienvenido usuario');
    }
}

// Cerrar sesión
function logout(){
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
}

// Actualizar UI de autenticación
function updateAuthUI(){
    // actualizar boton agregar
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        if (currentUser && currentUser.role === 'admin') {
            addProductBtn.disabled = false;
            addProductBtn.classList.remove('disabled');
        } else {
            addProductBtn.disabled = true;
            addProductBtn.classList.add('disabled');
        }
    }

    // actualizar userArea
    if (userArea) {
        if (!currentUser) {
            userArea.innerHTML = '<button id="loginBtn">Iniciar sesión</button>';
            // rehook
            setTimeout(() => {
                const newLoginBtn = document.getElementById('loginBtn');
                if (newLoginBtn) {
                    newLoginBtn.addEventListener('click', () => {
                        if (loginOverlay) {
                            loginOverlay.style.display = 'flex';
                            loginOverlay.setAttribute('aria-hidden', 'false');
                        }
                    });
                }
            }, 100);
        } else {
            userArea.innerHTML = `
                <div class="user-badge" title="Usuario">${escapeHtml(currentUser.name)} (${escapeHtml(currentUser.role)})</div>
                <button id="logoutBtn">Cerrar sesión</button>
            `;
            setTimeout(() => {
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', logout);
                }
            }, 100);
        }
    }
    
    // Re-renderizar productos para mostrar/ocultar botones de edición
    if (typeof renderProductos === 'function') {
        renderProductos(productos);
    }
}
