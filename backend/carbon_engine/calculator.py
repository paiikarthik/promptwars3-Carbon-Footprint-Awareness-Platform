# Carbon Footprint Calculator Engine

# Emission factors (kg CO2 per unit)
EMISSION_FACTORS = {
    "transportation": {
        "petrol_bike": 0.12,     # per km
        "diesel_car": 0.18,      # per km
        "ev": 0.05,              # per km (depending on grid)
        "public_transit": 0.04,  # per km
        "walk_cycle": 0.00       # per km
    },
    "energy": {
        "coal_grid": 0.85,       # per kWh
        "mixed_grid": 0.45,      # per kWh
        "solar": 0.05            # per kWh
    },
    "food": {
        "meat_heavy": 8.0,       # per day
        "balanced": 5.0,         # per day
        "vegetarian": 2.5,       # per day
        "vegan": 1.5             # per day
    },
    "lifestyle": {
        "purchase": 2.5,         # per shopping purchase
        "waste_landfill": 1.5,   # per day if not recycling
        "waste_recycled": 0.2    # per day if recycling
    }
}

# Average emissions benchmarks (kg CO2 per day)
BENCHMARKS = {
    "average_user_daily": 15.0,
    "target_user_daily": 6.0
}

def calculate_transport_emissions(distance_km: float, mode: str) -> float:
    factor = EMISSION_FACTORS["transportation"].get(mode, 0.12)
    return distance_km * factor

def calculate_energy_emissions(kwh: float, source: str) -> float:
    factor = EMISSION_FACTORS["energy"].get(source, 0.45)
    return kwh * factor

def calculate_food_emissions(diet_type: str) -> float:
    return EMISSION_FACTORS["food"].get(diet_type, 5.0)

def calculate_lifestyle_emissions(purchases: int, recycled: bool) -> float:
    shopping_co2 = purchases * EMISSION_FACTORS["lifestyle"]["purchase"]
    waste_co2 = (
        EMISSION_FACTORS["lifestyle"]["waste_recycled"] 
        if recycled else 
        EMISSION_FACTORS["lifestyle"]["waste_landfill"]
    )
    return shopping_co2 + waste_co2

def calculate_carbon_score(daily_co2: float) -> int:
    """
    Calculates carbon score out of 100.
    100 means very low carbon (<= 2 kg CO2 per day)
    0 means extremely high carbon (>= 30 kg CO2 per day)
    """
    if daily_co2 <= 2.0:
        return 100
    if daily_co2 >= 30.0:
        return 0
    
    # Linear scale between 2 and 30
    score = 100.0 - ((daily_co2 - 2.0) / (30.0 - 2.0)) * 100.0
    return int(max(0, min(100, score)))

def calculate_total_footprint(inputs: dict) -> dict:
    """
    Calculates total daily emissions and breakdown.
    inputs format:
    {
        "commute_distance_km": float,
        "commute_mode": str,
        "electricity_kwh": float,
        "home_energy_source": str,
        "diet_preference": str,
        "shopping_purchases": int,
        "waste_recycled": bool
    }
    """
    transport_co2 = calculate_transport_emissions(
        inputs.get("commute_distance_km", 0.0),
        inputs.get("commute_mode", "walk_cycle")
    )
    
    energy_co2 = calculate_energy_emissions(
        inputs.get("electricity_kwh", 0.0),
        inputs.get("home_energy_source", "mixed_grid")
    )
    
    food_co2 = calculate_food_emissions(
        inputs.get("diet_preference", "balanced")
    )
    
    lifestyle_co2 = calculate_lifestyle_emissions(
        inputs.get("shopping_purchases", 0),
        inputs.get("waste_recycled", False)
    )
    
    total_co2 = transport_co2 + energy_co2 + food_co2 + lifestyle_co2
    carbon_score = calculate_carbon_score(total_co2)
    
    return {
        "category_breakdown": {
            "transportation": round(transport_co2, 2),
            "energy": round(energy_co2, 2),
            "food": round(food_co2, 2),
            "lifestyle": round(lifestyle_co2, 2)
        },
        "total_emissions": round(total_co2, 2),
        "carbon_score": carbon_score,
        "benchmark_comparison": {
            "user_co2": round(total_co2, 2),
            "average_co2": BENCHMARKS["average_user_daily"],
            "difference_pct": round(((total_co2 - BENCHMARKS["average_user_daily"]) / BENCHMARKS["average_user_daily"]) * 100, 1)
        }
    }
