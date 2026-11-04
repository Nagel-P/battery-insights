from flask import Blueprint, render_template
pages_bp = Blueprint("pages", __name__)
@pages_bp.get("/")
def index(): return render_template("index.html")
@pages_bp.get("/analysis")
def analysis(): return render_template("analysis.html")
@pages_bp.get("/prediction")
def prediction(): return render_template("prediction.html")
