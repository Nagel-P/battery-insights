from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from pathlib import Path
from app.services.data_loader import load_dataset
from app.services.data_manager import data_manager
upload_bp = Blueprint("upload", __name__)
@upload_bp.get("/status")
def status(): return jsonify(data_manager.status())
@upload_bp.post("/upload")
def upload():
    if "file" not in request.files: return jsonify({"error":"Selecione um arquivo."}), 400
    file = request.files["file"]
    if not file.filename: return jsonify({"error":"Nome de arquivo vazio."}), 400
    filename = secure_filename(file.filename)
    if Path(filename).suffix.lower().lstrip(".") not in current_app.config["ALLOWED_EXTENSIONS"]:
        return jsonify({"error":"Formato inválido. Envie CSV, JSON ou XML."}), 400
    path = current_app.config["UPLOAD_FOLDER"] / filename
    file.save(path)
    try:
        df = load_dataset(path)
        data_manager.set_data(df, filename)
        return jsonify({"message":"Base carregada com sucesso.", **data_manager.status()})
    except Exception as exc:
        path.unlink(missing_ok=True)
        return jsonify({"error":str(exc)}), 400
