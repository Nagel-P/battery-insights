import numpy as np, pandas as pd
from app.services.regression_service import train_regression
from app.services.classification_service import train_classification
from app.services.clustering_service import train_clustering

def sample(n=60):
    rng=np.random.default_rng(7)
    return pd.DataFrame({"battery_id":[f"B{i}" for i in range(n)],"fast_charge_ratio":rng.random(n),"avg_depth_of_discharge_pct":rng.uniform(20,90,n),"avg_state_of_charge_pct":rng.uniform(20,95,n),"avg_daily_distance_km":rng.uniform(10,150,n),"charge_cycles_per_month":rng.integers(5,40,n),"avg_ambient_temp_c":rng.uniform(10,40,n),"state_of_health_pct":rng.uniform(70,100,n),"failure_risk_label":np.where(np.arange(n)%3==0,"High","Low"),"capacity_fade_pct":rng.uniform(0,30,n),"remaining_useful_life_cycles":rng.integers(100,1000,n),"degradation_category":"normal"})

def test_regression():
    model,metrics,features,_,_=train_regression(sample())
    assert "mae" in metrics and "capacity_fade_pct" not in features

def test_classification():
    _,metrics,features,_,_=train_classification(sample())
    assert "f1_macro" in metrics and "failure_risk_label" not in features

def test_clustering():
    result=train_clustering(sample(),4)
    assert result["n_batteries"]==60 and len(result["clusters"])==4
