import pandas as pd
from sklearn.cluster import KMeans
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from app.services.preprocessing import CLUSTER_FEATURES

def train_clustering(df, n_clusters=4):
    if "battery_id" not in df: raise ValueError("Clusterização requer a coluna battery_id para agregar registros por bateria.")
    features = [c for c in CLUSTER_FEATURES if c in df.columns]
    if len(features) < 2: raise ValueError("São necessárias pelo menos duas das seis variáveis de clusterização previstas.")
    aggregated = df.groupby("battery_id", as_index=False)[features].median(numeric_only=True)
    if len(aggregated) <= n_clusters: raise ValueError(f"São necessárias mais de {n_clusters} baterias distintas.")
    pipeline = Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler()), ("kmeans", KMeans(n_clusters=int(n_clusters), random_state=42, n_init=10))])
    labels = pipeline.fit_predict(aggregated[features])
    aggregated["cluster"] = labels
    return {"n_batteries": int(len(aggregated)), "features": features,
            "clusters": aggregated.groupby("cluster").size().sort_index().to_dict(),
            "assignments": aggregated.astype(object).where(pd.notna(aggregated), None).to_dict(orient="records"),
            "inertia": round(float(pipeline.named_steps["kmeans"].inertia_), 3)}
