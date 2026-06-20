from carbon_engine.constants import (
    AVERAGE_USER_DAILY_CO2,
    DEFAULT_COMMUTE_MODE,
    DEFAULT_DIET,
    DEFAULT_ENERGY_SOURCE,
    ENERGY_EMISSION_FACTORS,
    FOOD_EMISSION_FACTORS,
    LIFESTYLE_EMISSION_FACTORS,
    TARGET_USER_DAILY_CO2,
    TRANSPORT_EMISSION_FACTORS,
)

# Average emissions benchmarks (kg CO2 per day)
BENCHMARKS = {
    "average_user_daily": AVERAGE_USER_DAILY_CO2,
    "target_user_daily": TARGET_USER_DAILY_CO2
}

def calculate_transport_emissions(distance_km: float, mode: str) -> float:
    factor = TRANSPORT_EMISSION_FACTORS.get(mode, TRANSPORT_EMISSION_FACTORS[DEFAULT_COMMUTE_MODE])
    return distance_km * factor

def calculate_energy_emissions(kwh: float, source: str) -> float:
    factor = ENERGY_EMISSION_FACTORS.get(source, ENERGY_EMISSION_FACTORS[DEFAULT_ENERGY_SOURCE])
    return kwh * factor

def calculate_food_emissions(diet_type: str) -> float:
    return FOOD_EMISSION_FACTORS.get(diet_type, FOOD_EMISSION_FACTORS[DEFAULT_DIET])

def calculate_lifestyle_emissions(purchases: int, recycled: bool) -> float:
    shopping_co2 = purchases * LIFESTYLE_EMISSION_FACTORS["purchase"]
    waste_co2 = (
        LIFESTYLE_EMISSION_FACTORS["waste_recycled"]
        if recycled else 
        LIFESTYLE_EMISSION_FACTORS["waste_landfill"]
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
        inputs.get("home_energy_source", DEFAULT_ENERGY_SOURCE)
    )
    
    food_co2 = calculate_food_emissions(
        inputs.get("diet_preference", DEFAULT_DIET)
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
