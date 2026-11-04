import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import GroupShuffleSplit, train_test_split

LEAKAGE_COLUMNS = {"capacity_fade_pct", "remaining_useful_life_cycles", "failure_risk_label", "degradation_category", "state_of_health_pct"}
CLUSTER_FEATURES = ["fast_charge_ratio", "avg_depth_of_discharge_pct", "avg_state_of_charge_pct", "avg_daily_distance_km", "charge_cycles_per_month", "avg_ambient_temp_c"]

def split_data(df, target, test_size=0.2, random_state=42):
    X = df.drop(columns=[target])
    groups = X["battery_id"] if "battery_id" in X.columns else None
    # IDs são usados para separar grupos, mas não como atributo preditivo.
    X = X.drop(columns=["battery_id"], errors="ignore")
    # Remove variáveis que revelam o alvo ou resultados derivados; preserva apenas atributos disponíveis.
    X = X.drop(columns=[c for c in LEAKAGE_COLUMNS if c in X.columns], errors="ignore")
    y = df[target]
    if groups is not None and groups.nunique() >= 2:
        splitter = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
        train_idx, test_idx = next(splitter.split(X, y, groups))
        return X.iloc[train_idx], X.iloc[test_idx], y.iloc[train_idx], y.iloc[test_idx]
    return train_test_split(X, y, test_size=test_size, random_state=random_state)

def build_preprocessor(X, scale=True):
    numeric = list(X.select_dtypes(include="number").columns)
    categorical = list(X.select_dtypes(exclude="number").columns)
    num_steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale:
        num_steps.append(("scaler", StandardScaler()))
    transformers = []
    if numeric:
        transformers.append(("numeric", Pipeline(num_steps), numeric))
    if categorical:
        transformers.append(("categorical", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))]), categorical))
    if not transformers:
        raise ValueError("Não há atributos utilizáveis para treinamento.")
    return ColumnTransformer(transformers, remainder="drop")
