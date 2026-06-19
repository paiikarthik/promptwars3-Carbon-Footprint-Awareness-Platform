import pytest
from carbon_engine.calculator import (
    calculate_transport_emissions,
    calculate_energy_emissions,
    calculate_food_emissions,
    calculate_lifestyle_emissions,
    calculate_carbon_score,
    calculate_total_footprint
)
from carbon_engine.predictor import predict_next_month_emissions

def test_transport_emissions():
    # Petrol bike: 0.12 kg CO2 / km * 15 km = 1.8 kg CO2
    assert calculate_transport_emissions(15.0, "petrol_bike") == 1.8
    # Diesel car: 0.18 kg CO2 / km * 10 km = 1.8 kg CO2
    assert calculate_transport_emissions(10.0, "diesel_car") == 1.8
    # Walk/Cycle: 0.0 kg CO2 / km
    assert calculate_transport_emissions(20.0, "walk_cycle") == 0.0

def test_energy_emissions():
    # Coal power: 0.85 kg CO2 / kWh * 10 kWh = 8.5 kg CO2
    assert calculate_energy_emissions(10.0, "coal_grid") == 8.5
    # Solar: 0.05 kg CO2 / kWh * 10 kWh = 0.5 kg CO2
    assert calculate_energy_emissions(10.0, "solar") == 0.5

def test_food_emissions():
    assert calculate_food_emissions("vegan") == 1.5
    assert calculate_food_emissions("meat_heavy") == 8.0

def test_lifestyle_emissions():
    # 2 purchases * 2.5 + waste_recycled (0.2) = 5.2 kg CO2
    assert calculate_lifestyle_emissions(2, True) == 5.2
    # 0 purchases * 2.5 + waste_landfill (1.5) = 1.5 kg CO2
    assert calculate_lifestyle_emissions(0, False) == 1.5

def test_carbon_score():
    # If daily carbon is low (<= 2.0), score is 100
    assert calculate_carbon_score(1.5) == 100
    # If daily carbon is extremely high (>= 30.0), score is 0
    assert calculate_carbon_score(35.0) == 0
    # Moderate emissions score check (e.g. 16 kg)
    # 100 - ((16 - 2) / (30 - 2)) * 100 = 100 - (14/28)*100 = 50
    assert calculate_carbon_score(16.0) == 50

def test_total_footprint():
    inputs = {
        "commute_distance_km": 15.0,
        "commute_mode": "petrol_bike", # 1.8
        "electricity_kwh": 8.0,
        "home_energy_source": "mixed_grid", # 8 * 0.45 = 3.6
        "diet_preference": "balanced", # 5.0
        "shopping_purchases": 1, # 2.5
        "waste_recycled": True # 0.2
    }
    # Total expected: 1.8 + 3.6 + 5.0 + 2.5 + 0.2 = 13.1 kg CO2
    res = calculate_total_footprint(inputs)
    assert res["total_emissions"] == 13.1
    assert "carbon_score" in res
    assert res["category_breakdown"]["transportation"] == 1.8
    assert res["category_breakdown"]["energy"] == 3.6

def test_predictor_model():
    # Fit prediction with dummy logs
    dummy_logs = [
        {"date": "2026-06-01", "total_emissions": 12.0},
        {"date": "2026-06-02", "total_emissions": 13.0},
        {"date": "2026-06-03", "total_emissions": 11.5},
    ]
    user_profile = {
        "region": "temperate",
        "diet_preference": "balanced",
        "commute_distance_km": 15.0,
        "commute_mode": "petrol_bike"
    }
    
    pred = predict_next_month_emissions(dummy_logs, user_profile)
    assert "predicted_next_month_total" in pred
    assert "reason" in pred
    assert len(pred["weekly_predictions"]) == 4
