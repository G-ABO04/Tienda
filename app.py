from flask import Flask, request, redirect, make_response
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(os.path.dirname(__file__), 'users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    usuario = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

# Crear BD si no existe
with app.app_context():
    db.create_all()

def make_login_response(user):
    # Devuelve HTML que guarda currentUser en localStorage y redirige a index.html
    payload = {
        "name": user.nombre,
        "username": user.usuario,
        "role": user.role
    }
    js = f"""
    <script>
      localStorage.setItem('currentUser', JSON.stringify({payload}));
      window.location.href = '/index.html';
    </script>
    """
    resp = make_response(js)
    resp.headers['Content-Type'] = 'text/html; charset=utf-8'
    return resp

@app.route('/register', methods=['POST'])
def register():
    nombre = request.form.get('nombre') or request.form.get('nombre') or ''
    email = (request.form.get('email') or '').strip().lower()
    usuario = (request.form.get('usuario_reg') or request.form.get('usuario') or '').strip()
    clave = request.form.get('clave_reg') or request.form.get('clave') or ''
    role = (request.form.get('role') or 'user').lower()
    if not (nombre and email and usuario and clave):
        return "Faltan campos", 400

    if User.query.filter_by(usuario=usuario).first():
        return "Usuario ya existe", 400
    if User.query.filter_by(email=email).first():
        return "Email ya registrado", 400

    u = User(
        nombre=nombre,
        email=email,
        usuario=usuario,
        password_hash=generate_password_hash(clave),
        role='admin' if role == 'admin' else 'user'
    )
    db.session.add(u)
    db.session.commit()
    return make_login_response(u)

@app.route('/login', methods=['POST'])
def login():
    usuario = (request.form.get('usuario') or '').strip()
    clave = request.form.get('clave') or ''
    # admite también campo 'tipo' si lo envía el formulario
    if not (usuario and clave):
        return "Faltan credenciales", 400

    u = User.query.filter_by(usuario=usuario).first()
    if not u or not u.check_password(clave):
        return "Usuario o contraseña incorrectos", 401

    return make_login_response(u)

@app.route('/logout', methods=['GET'])
def logout():
    # Simplemente devolver HTML que borra localStorage y redirige a login
    js = """
    <script>
      localStorage.removeItem('currentUser');
      window.location.href = '/login.html';
    </script>
    """
    return make_response(js)

if __name__ == '__main__':
    # Ejecutar en 0.0.0.0 para pruebas locales; cambia host/port según necesites
    app.run(debug=True, host='127.0.0.1', port=5000)