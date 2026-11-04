from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, GradientBoostingRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from app.services.preprocessing import split_data, build_preprocessor

MODELS = {"random_forest": RandomForestRegressor, "extra_trees": ExtraTreesRegressor, "gradient_boosting": GradientBoostingRegressor, "decision_tree": DecisionTreeRegressor}

def train_regression(df, target="state_of_health_pct", algorithm="random_forest", params=None):
    if target not in df: raise ValueError(f"A coluna alvo '{target}' não existe na base.")
    if algorithm not in MODELS: raise ValueError("Algoritmo de regressão inválido.")
    work = df.dropna(subset=[target]).copy()
    X_train, X_test, y_train, y_test = split_data(work, target)
    params = params or {}
    allowed = {"n_estimators", "max_depth", "min_samples_split", "min_samples_leaf", "learning_rate"}
    clean = {k:v for k,v in params.items() if k in allowed and v not in (None, "")}
    for k in ("n_estimators", "max_depth", "min_samples_split", "min_samples_leaf"):
        if k in clean: clean[k] = int(clean[k])
    if "learning_rate" in clean: clean["learning_rate"] = float(clean["learning_rate"])
    model = Pipeline([("preprocessor", build_preprocessor(X_train)), ("model", MODELS[algorithm](**clean))])
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    metrics = {"mae": round(float(mean_absolute_error(y_test, pred)), 4), "rmse": round(float(mean_squared_error(y_test, pred) ** 0.5), 4), "r2": round(float(r2_score(y_test, pred)), 4)}
    return model, metrics, list(X_train.columns), int(len(X_train)), int(len(X_test))
