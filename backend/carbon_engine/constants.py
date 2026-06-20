TRANSPORT_EMISSION_FACTORS = {
    "petrol_bike": 0.12,
    "diesel_car": 0.18,
    "ev": 0.05,
    "public_transit": 0.04,
    "walk_cycle": 0.0,
}

ENERGY_EMISSION_FACTORS = {
    "coal_grid": 0.85,
    "mixed_grid": 0.45,
    "solar": 0.05,
}

FOOD_EMISSION_FACTORS = {
    "meat_heavy": 8.0,
    "balanced": 5.0,
    "vegetarian": 2.5,
    "vegan": 1.5,
}

LIFESTYLE_EMISSION_FACTORS = {
    "purchase": 2.5,
    "waste_landfill": 1.5,
    "waste_recycled": 0.2,
}

COMMUTE_MODES = tuple(TRANSPORT_EMISSION_FACTORS)
ENERGY_SOURCES = tuple(ENERGY_EMISSION_FACTORS)
DIET_PREFERENCES = tuple(FOOD_EMISSION_FACTORS)

DEFAULT_COMMUTE_MODE = "petrol_bike"
DEFAULT_ENERGY_SOURCE = "mixed_grid"
DEFAULT_DIET = "balanced"
DEFAULT_REGION = "temperate"

IMPACT_THRESHOLDS = {
    "transportation": (1.5, 4.0),
    "energy": (2.5, 6.0),
    "food": (2.0, 5.0),
    "lifestyle": (1.0, 3.0),
}

AVERAGE_USER_DAILY_CO2 = 15.0
TARGET_USER_DAILY_CO2 = 6.0
