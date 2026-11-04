from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix
from app.services.preprocessing import split_data, build_preprocessor

MODELS = {"random_forest": RandomForestClassifier, "decision_tree": DecisionTreeClassifier, "extra_trees": ExtraTreesClassifier, "knn": KNeighborsClassifier, "gradient_boosting": GradientBoostingClassifier}

def train_classification(df, target="failure_risk_label", algorithm="random_forest", params=None):
    if target not in df: raise ValueError(f"A coluna alvo '{target}' não existe na base.")
    if algorithm not in MODELS: raise ValueError("Algoritmo de classificação inválido.")
    work = df.dropna(subset=[target]).copy()
    if work[target].nunique() < 2: raise ValueError("A classificação exige pelo menos duas classes.")
    X_train, X_test, y_train, y_test = split_data(work, target)
    params = params or {}
    allowed = {"n_estimators", "max_depth", "min_samples_split", "n_neighbors", "weights", "learning_rate"}
    clean = {k:v for k,v in params.items() if k in allowed and v not in (None, "")}
    for k in ("n_estimators", "max_depth", "min_samples_split", "n_neighbors"):
        if k in clean: clean[k] = int(clean[k])
    if "learning_rate" in clean: clean["learning_rate"] = float(clean["learning_rate"])
    model = Pipeline([("preprocessor", build_preprocessor(X_train)), ("model", MODELS[algorithm](**clean))])
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    labels = sorted(map(str, work[target].unique()))
    metrics = {"accuracy": round(float(accuracy_score(y_test, pred)), 4),
               "precision_macro": round(float(precision_score(y_test, pred, average="macro", zero_division=0)), 4),
               "recall_macro": round(float(recall_score(y_test, pred, average="macro", zero_division=0)), 4),
               "f1_macro": round(float(f1_score(y_test, pred, average="macro", zero_division=0)), 4),
               "labels": labels, "confusion_matrix": confusion_matrix(y_test, pred, labels=labels).tolist(),
               "report": classification_report(y_test, pred, output_dict=True, zero_division=0)}
    if "High" in labels:
        metrics["high_recall"] = round(float(recall_score((y_test.astype(str)=="High"), (pred.astype(str)=="High"), zero_division=0)), 4)
    return model, metrics, list(X_train.columns), int(len(X_train)), int(len(X_test))
