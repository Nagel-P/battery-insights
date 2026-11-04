from flask import Blueprint, jsonify, request
from app.services.data_manager import data_manager
from app.services.analysis_service import summarize, chart_data, correlation_data
analysis_bp = Blueprint("analysis", __name__)
@analysis_bp.get("/summary")
def summary():
    try: return jsonify(summarize(data_manager.get_data()))
    except Exception as exc: return jsonify({"error":str(exc)}), 400
@analysis_bp.get("/chart")
def chart():
    try: return jsonify(chart_data(data_manager.get_data(), request.args.get("column", "")))
    except Exception as exc: return jsonify({"error":str(exc)}), 400
@analysis_bp.get("/correlation")
def correlation():
    try: return jsonify(correlation_data(data_manager.get_data()))
    except Exception as exc: return jsonify({"error":str(exc)}), 400
