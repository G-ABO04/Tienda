from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json
import random

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///usuarios.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelo de Usuario
class UsuarioPersonalizado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    transacciones = db.relationship('Transaccion', backref='usuario', lazy=True)

# Modelo de Método de Pago
class MetodoPago(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    activo = db.Column(db.Boolean, default=True)
    config = db.Column(db.Text)  # JSON con configuración
    
    transacciones = db.relationship('Transaccion', backref='metodo_pago', lazy=True)

# Modelo de Transacción
class Transaccion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario_personalizado.id'), nullable=False)
    metodo_pago_id = db.Column(db.Integer, db.ForeignKey('metodo_pago.id'), nullable=False)
    monto = db.Column(db.Float, nullable=False)
    moneda = db.Column(db.String(10), default='USD')
    descripcion = db.Column(db.Text)
    estado = db.Column(db.String(50), default='pendiente')
    datos_pago = db.Column(db.Text)  # JSON con datos del pago
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Crear tablas e insertar datos iniciales
def inicializar_datos():
    with app.app_context():
        db.create_all()
        
        # Insertar métodos de pago si no existen
        if MetodoPago.query.count() == 0:
            metodos = [
                MetodoPago(nombre='Tarjeta de Crédito', tipo='tarjeta', config='{"comision": 0.029, "comision_fija": 0.30}'),
                MetodoPago(nombre='PayPal', tipo='paypal', config='{"comision": 0.034, "comision_fija": 0.35}'),
                MetodoPago(nombre='Transferencia Bancaria', tipo='transferencia', config='{"comision": 0.0, "comision_fija": 0.0}'),
                MetodoPago(nombre='Efectivo', tipo='efectivo', config='{"comision": 0.0, "comision_fija": 0.0}')
            ]
            db.session.bulk_save_objects(metodos)
            db.session.commit()

# Rutas de Usuarios (existentes)
@app.route('/api/registro', methods=['POST'])
def registro():
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not all([nombre, email, password]):
        return jsonify({'success': False, 'data': 'Faltan campos'})
    
    if UsuarioPersonalizado.query.filter_by(email=email).first():
        return jsonify({'success': False, 'data': 'Email ya existe'})
    
    usuario = UsuarioPersonalizado(
        nombre=nombre,
        email=email,
        password=generate_password_hash(password)
    )
    db.session.add(usuario)
    db.session.commit()
    
    return jsonify({'success': True, 'data': 'Usuario creado'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    usuario = UsuarioPersonalizado.query.filter_by(email=email, activo=True).first()
    
    if not usuario or not check_password_hash(usuario.password, password):
        return jsonify({'success': False, 'data': 'Credenciales incorrectas'})
    
    return jsonify({
        'success': True,
        'data': {
            'mensaje': 'Login correcto',
            'usuario': {
                'id': usuario.id,
                'nombre': usuario.nombre,
                'email': usuario.email
            }
        }
    })

# 🆕 RUTAS DE PAGOS
@app.route('/api/pagos/metodos', methods=['GET'])
def obtener_metodos_pago():
    metodos = MetodoPago.query.filter_by(activo=True).all()
    resultado = []
    for metodo in metodos:
        resultado.append({
            'id': metodo.id,
            'nombre': metodo.nombre,
            'tipo': metodo.tipo,
            'config': json.loads(metodo.config) if metodo.config else {}
        })
    return jsonify({'success': True, 'data': resultado})

@app.route('/api/pagos/procesar', methods=['POST'])
def procesar_pago():
    data = request.get_json()
    
    usuario_id = data.get('usuario_id')
    metodo_pago_id = data.get('metodo_pago_id')
    monto = data.get('monto')
    descripcion = data.get('descripcion', '').strip()
    
    # Validaciones
    if not all([usuario_id, metodo_pago_id, monto]):
        return jsonify({'success': False, 'data': 'Datos incompletos'})
    
    try:
        monto = float(monto)
        if monto <= 0:
            return jsonify({'success': False, 'data': 'Monto inválido'})
    except:
        return jsonify({'success': False, 'data': 'Monto debe ser numérico'})
    
    # Verificar usuario
    usuario = UsuarioPersonalizado.query.get(usuario_id)
    if not usuario:
        return jsonify({'success': False, 'data': 'Usuario no encontrado'})
    
    # Verificar método de pago
    metodo = MetodoPago.query.get(metodo_pago_id)
    if not metodo or not metodo.activo:
        return jsonify({'success': False, 'data': 'Método de pago no válido'})
    
    # Crear transacción
    datos_pago = {
        'metodo': metodo.tipo,
        'fecha': datetime.utcnow().isoformat(),
        'ip': request.remote_addr
    }
    
    transaccion = Transaccion(
        usuario_id=usuario_id,
        metodo_pago_id=metodo_pago_id,
        monto=monto,
        descripcion=descripcion,
        datos_pago=json.dumps(datos_pago)
    )
    
    db.session.add(transaccion)
    db.session.commit()
    
    # Simular procesamiento de pago
    estado_final = simular_procesamiento_pago(metodo.tipo, monto)
    
    # Actualizar estado
    transaccion.estado = estado_final
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': {
            'mensaje': 'Pago procesado correctamente',
            'transaccion_id': transaccion.id,
            'estado': estado_final,
            'metodo': metodo.nombre,
            'monto': monto
        }
    })

def simular_procesamiento_pago(tipo_metodo, monto):
    """Simula el procesamiento de pago con diferentes tasas de éxito"""
    tasas_exito = {
        'tarjeta': 0.85,      # 85% éxito
        'paypal': 0.90,       # 90% éxito  
        'transferencia': 0.95, # 95% éxito
        'efectivo': 1.00      # 100% éxito
    }
    
    tasa = tasas_exito.get(tipo_metodo, 0.80)
    return 'completado' if random.random() <= tasa else 'fallido'

@app.route('/api/pagos/historial', methods=['GET'])
def obtener_historial_pagos():
    usuario_id = request.args.get('usuario_id', type=int)
    
    if not usuario_id:
        return jsonify({'success': False, 'data': 'ID de usuario requerido'})
    
    transacciones = Transaccion.query.filter_by(usuario_id=usuario_id)\
        .join(MetodoPago)\
        .order_by(Transaccion.fecha_creacion.desc())\
        .limit(10)\
        .all()
    
    resultado = []
    for trans in transacciones:
        resultado.append({
            'id': trans.id,
            'monto': trans.monto,
            'moneda': trans.moneda,
            'descripcion': trans.descripcion,
            'estado': trans.estado,
            'metodo_nombre': trans.metodo_pago.nombre,
            'fecha_creacion': trans.fecha_creacion.isoformat()
        })
    
    return jsonify({'success': True, 'data': resultado})

# Páginas HTML
@app.route('/registro')
def pagina_registro():
    return render_template('registro.html')

@app.route('/login')
def pagina_login():
    return render_template('login.html')

@app.route('/pagos')
def pagina_pagos():
    return render_template('pagos.html')

@app.route('/')
def index():
    return '''
    <h1>Sistema de Usuarios y Pagos</h1>
    <ul>
        <li><a href="/registro">Registro</a></li>
        <li><a href="/login">Login</a></li>
        <li><a href="/pagos">Sistema de Pagos</a></li>
    </ul>
    '''

if __name__ == '__main__':
    inicializar_datos()
    app.run(debug=True)
