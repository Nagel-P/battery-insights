import pandas as pd
from app.services.analysis_service import summarize, chart_data

def test_summary_and_chart():
    df=pd.DataFrame({"soh":[90,80,85],"risk":["Low","High","Low"]})
    result=summarize(df)
    assert result["rows"]==3
    assert "soh" in result["numeric_columns"]
    assert sum(chart_data(df,"risk")["values"])==3
