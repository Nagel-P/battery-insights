import pandas as pd
from app.services.data_loader import load_dataset

def test_load_csv(tmp_path):
    path=tmp_path/"sample.csv"; pd.DataFrame({"a":[1,2]}).to_csv(path,index=False)
    assert len(load_dataset(path))==2

def test_reject_unknown_extension(tmp_path):
    path=tmp_path/"sample.txt"; path.write_text("a")
    try: load_dataset(path)
    except ValueError as exc: assert "não suportado" in str(exc)
    else: assert False
