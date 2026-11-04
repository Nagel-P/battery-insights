import pandas as pd
import numpy as np

def summarize(df):
    numeric = df.select_dtypes(include=np.number)
    stats = numeric.describe().replace({np.nan: None}).to_dict()
    missing = df.isna().sum().to_dict()
    return {"rows": int(len(df)), "columns": int(len(df.columns)), "column_names": list(df.columns),
            "numeric_columns": list(numeric.columns), "categorical_columns": list(df.select_dtypes(exclude=np.number).columns),
            "missing": {str(k): int(v) for k,v in missing.items()}, "describe": stats,
            "dtypes": {str(k): str(v) for k,v in df.dtypes.items()},
            "preview": df.head(8).astype(object).where(pd.notna(df.head(8)), None).to_dict(orient="records")}

def chart_data(df, column):
    if column not in df.columns:
        raise ValueError("Coluna não encontrada.")
    series = df[column].dropna()
    if pd.api.types.is_numeric_dtype(series):
        counts, edges = np.histogram(series, bins=min(15, max(5, int(np.sqrt(len(series))))))
        labels = [f"{edges[i]:.2f}–{edges[i+1]:.2f}" for i in range(len(edges)-1)]
        return {"type": "bar", "labels": labels, "values": counts.astype(int).tolist(), "title": f"Distribuição de {column}"}
    counts = series.astype(str).value_counts().head(15)
    return {"type": "bar", "labels": counts.index.tolist(), "values": counts.values.astype(int).tolist(), "title": f"Frequência de {column}"}

def correlation_data(df):
    corr = df.select_dtypes(include=np.number).corr(numeric_only=True).fillna(0)
    return {"columns": list(corr.columns), "values": corr.round(3).values.tolist()}
