import json
import xml.etree.ElementTree as ET
from pathlib import Path
import pandas as pd

SUPPORTED = {"csv", "json", "xml"}

def load_dataset(path):
    """Lê CSV, JSON (records/array ou objeto com records) e XML tabular."""
    path = Path(path)
    ext = path.suffix.lower().lstrip(".")
    if ext not in SUPPORTED:
        raise ValueError("Formato não suportado. Use CSV, JSON ou XML.")
    if ext == "csv":
        df = pd.read_csv(path)
    elif ext == "json":
        try:
            df = pd.read_json(path)
        except ValueError:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(payload, dict):
                payload = payload.get("records", payload.get("data", payload))
            df = pd.DataFrame(payload if isinstance(payload, list) else [payload])
    else:
        root = ET.parse(path).getroot()
        records = []
        for element in list(root):
            records.append({child.tag: child.text for child in list(element)})
        if not records and list(root):
            records = [{child.tag: child.text for child in list(root)}]
        df = pd.DataFrame(records)
    if df.empty:
        raise ValueError("O arquivo não contém registros.")
    df.columns = [str(c).strip() for c in df.columns]
    df = df.dropna(how="all")
    # Campo ausente representa bateria sem serviço registrado, não dado inválido.
    if "last_service_date" in df.columns:
        df["last_service_date"] = df["last_service_date"].fillna("never")
    if df.empty:
        raise ValueError("A base contém apenas linhas vazias.")
    return df
