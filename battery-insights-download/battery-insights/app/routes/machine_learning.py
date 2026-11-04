from flask import Blueprint, jsonify, request
import pandas as pd
from app.services.data_manager import data_manager
from app.services.regression_service import train_regression
from app.services.classification_service import train_classification
from app.services.clustering_service import train_clustering
ml_bp = Blueprint("machine_learning", __name__)
models = {}
@ml_bp.post("/train")
def train():
    try:
        payload = request.get_json(silent=True) or {}
        kind = payload.get("kind", "regression")
        df = data_manager.get_data()
        if kind == "regression":
            model, metrics, features, n_train, n_test = train_regression(df, payload.get("target", "state_of_health_pct"), payload.get("algorithm", "random_forest"), payload.get("params", {}))
        elif kind == "classification":
            model, metrics, features, n_train, n_test = train_classification(df, payload.get("target", "failure_risk_label"), payload.get("algorithm", "random_forest"), payload.get("params", {}))
        elif kind == "clustering":
            result = train_clustering(df, payload.get("n_clusters", 4))
            models["clustering"] = result
            return jsonify({"kind":kind, "metrics":result, "message":"Clusterização recalculada com a base atual."})
        else: return jsonify({"error":"Tipo de modelo inválido."}), 400
        models[kind] = {"model":model, "features":features, "target":payload.get("target", "state_of_health_pct" if kind=="regression" else "failure_risk_label"), "generation":data_manager.generation}
        return jsonify({"kind":kind, "metrics":metrics, "features":features, "train_rows":n_train, "test_rows":n_test, "message":"Modelo treinado com a base atual."})
    except Exception as exc: return jsonify({"error":str(exc)}), 400
@ml_bp.post("/predict")
def predict():
    try:
        payload = request.get_json(force=True)
        kind = payload.get("kind", "regression")
        stored = models.get(kind)
        if not stored or stored.get("generation") != data_manager.generation: return jsonify({"error":"Treine novamente o modelo após carregar ou atualizar a base."}), 400
        row = payload.get("values", {})
        X = pd.DataFrame([{feature:row.get(feature) for feature in stored["features"]}])
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors="ignore")
        prediction = stored["model"].predict(X)[0]
        result = {"prediction": prediction.item() if hasattr(prediction,"item") else str(prediction)}
        if hasattr(stored["model"], "predict_proba"):
            probabilities = stored["model"].predict_proba(X)[0]
            result["probabilities"] = {str(label):round(float(prob),4) for label,prob in zip(stored["model"].classes_, probabilities)}
        return jsonify(result)
    except Exception as exc: return jsonify({"error":str(exc)}), 400
