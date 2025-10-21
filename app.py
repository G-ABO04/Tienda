# app.py — Flask + SQLite (CRUD productos)
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Numeric, Text
from sqlalchemy.orm import declarative_base, sessionmaker
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_URL   = "sqlite:///" + os.path.join(BASE_DIR, "tiendita.db")

app = Flask(__name__)
CORS(app)  # Permite llamadas desde front

# --- DB / Modelos ---
engine = create_engine(DB_URL, echo=False, future=True)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

class Producto(Base):
    __tablename__ = "productos"
    id          = Column(Integer, primary_key=True)
    nombre      = Column(String(120), nullable=False)
    categoria   = Column(String(60), default="general")
    precio      = Column(Numeric(10, 2), nullable=False)
    imagen      = Column(Text, nullable=True)
    descripcion = Column(Text, nullable=True)

Base.metadata.create_all(engine)  # crea tabla si no existe

# --- Pages ---
@app.get("/")
def home():
    return render_template("index.html")

# --- API Productos ---
@app.get("/api/productos")
def listar():
    with SessionLocal() as db:
        prods = db.query(Producto).order_by(Producto.id.desc()).all()
        return jsonify(ok=True, items=[{
            "id": p.id,
            "nombre": p.nombre,
            "categoria": p.categoria,
            "precio": float(p.precio),
            "imagen": p.imagen or "",
            "descripcion": p.descripcion or ""
        } for p in prods])

@app.post("/api/productos")
def crear():
    d = request.get_json(force=True)
    nombre = (d.get("nombre") or "").strip()
    categoria = (d.get("categoria") or "general").strip()
    imagen = d.get("imagen") or ""
    descripcion = d.get("descripcion") or ""
    if not nombre or d.get("precio") is None:
        return jsonify(ok=False, msg="Faltan nombre o precio"), 400
    try:
        precio = float(d["precio"])
    except:
        return jsonify(ok=False, msg="Precio inválido"), 400
    with SessionLocal() as db:
        p = Producto(
            nombre=nombre, categoria=categoria.lower(),
            precio=precio, imagen=imagen, descripcion=descripcion
        )
        db.add(p); db.commit()
        return jsonify(ok=True, id=p.id)

@app.put("/api/productos/<int:pid>")
@app.patch("/api/productos/<int:pid>")
def actualizar(pid):
    d = request.get_json(force=True)
    with SessionLocal() as db:
        p = db.get(Producto, pid)
        if not p:
            return jsonify(ok=False, msg="No encontrado"), 404
        if "nombre" in d and d["nombre"]: p.nombre = d["nombre"].strip()
        if "categoria" in d and d["categoria"]: p.categoria = d["categoria"].strip().lower()
        if "precio" in d:
            try:
                p.precio = float(d["precio"])
            except:
                return jsonify(ok=False, msg="Precio inválido"), 400
        if "imagen" in d: p.imagen = d.get("imagen") or ""
        if "descripcion" in d: p.descripcion = d.get("descripcion") or ""
        db.commit()
        return jsonify(ok=True, msg="Actualizado")

@app.delete("/api/productos/<int:pid>")
def eliminar(pid):
    with SessionLocal() as db:
        p = db.get(Producto, pid)
        if not p:
            return jsonify(ok=False, msg="No encontrado"), 404
        db.delete(p); db.commit()
        return jsonify(ok=True, msg="Eliminado")

if __name__ == "__main__":
    app.run(debug=True)
