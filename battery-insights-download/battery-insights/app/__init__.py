from flask import Flask, jsonify
from app.config import Config
from app.routes.pages import pages_bp
from app.routes.upload import upload_bp
from app.routes.analysis import analysis_bp
from app.routes.machine_learning import ml_bp

def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)
    app.config["UPLOAD_FOLDER"].mkdir(parents=True, exist_ok=True)
    app.register_blueprint(pages_bp)
    app.register_blueprint(upload_bp, url_prefix="/api")
    app.register_blueprint(analysis_bp, url_prefix="/api")
    app.register_blueprint(ml_bp, url_prefix="/api")

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"error": "Arquivo excede o limite de 16 MB."}), 413

    return app
