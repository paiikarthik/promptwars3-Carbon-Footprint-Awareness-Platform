import os
import httpx
from math import radians, cos, sin, asin, sqrt
from carbon_engine.constants import DEFAULT_COMMUTE_MODE, TRANSPORT_EMISSION_FACTORS

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
HTTP_TIMEOUT_SECONDS = 10.0

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers.
    return c * r

def analyze_route_emissions(origin: str, destination: str, current_mode: str = DEFAULT_COMMUTE_MODE) -> dict:
    """
    Compares carbon footprint of different transport modes for a specific route.
    Queries Google Directions API if key is present, otherwise falls back to a simulated response.
    """
    distance_km = 15.0 # default mock
    duration_mins = 25.0
    
    if GOOGLE_MAPS_API_KEY:
        try:
            response = httpx.get(
                "https://maps.googleapis.com/maps/api/directions/json",
                params={"origin": origin, "destination": destination, "key": GOOGLE_MAPS_API_KEY},
                timeout=HTTP_TIMEOUT_SECONDS,
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("routes"):
                    leg = data["routes"][0]["legs"][0]
                    distance_km = leg["distance"]["value"] / 1000.0
                    duration_mins = leg["duration"]["value"] / 60.0
        except Exception as e:
            print(f"Error querying Google Directions API: {e}")

    modes_comparison = []
    for mode, factor in TRANSPORT_EMISSION_FACTORS.items():
        co2_emissions = distance_km * factor
        # Speed estimates for time
        speed_factors = {
            "petrol_bike": 40.0,
            "diesel_car": 35.0,
            "ev": 35.0,
            "public_transit": 30.0,
            "walk_cycle": 15.0
        }
        speed = speed_factors.get(mode, 30.0)
        mode_duration = (distance_km / speed) * 60.0
        
        modes_comparison.append({
            "mode": mode,
            "name": mode.replace("_", " ").title(),
            "emissions_kg": round(co2_emissions, 2),
            "duration_mins": int(mode_duration),
            "co2_saved_vs_current": round(
                (distance_km * TRANSPORT_EMISSION_FACTORS.get(
                    current_mode,
                    TRANSPORT_EMISSION_FACTORS[DEFAULT_COMMUTE_MODE],
                )) - co2_emissions,
                2,
            )
        })

    # Find the eco recommendation (minimum non-zero emission, or public transit)
    current_emissions = distance_km * TRANSPORT_EMISSION_FACTORS.get(
        current_mode,
        TRANSPORT_EMISSION_FACTORS[DEFAULT_COMMUTE_MODE],
    )
    savings = current_emissions - (distance_km * TRANSPORT_EMISSION_FACTORS["public_transit"])
    monthly_savings = savings * 2 * 20 # 20 round-trip commute days
    
    recommendation = f"Using public transport on this route instead of your current mode can reduce approximately {round(monthly_savings, 1)} kg CO2 per month."

    return {
        "origin": origin,
        "destination": destination,
        "distance_km": round(distance_km, 1),
        "duration_mins": int(duration_mins),
        "modes_comparison": sorted(modes_comparison, key=lambda x: x["emissions_kg"]),
        "ai_recommendation": recommendation
    }

def find_nearby_sustainable_places(latitude: float, longitude: float, place_type: str) -> list:
    """
    Finds nearby EV charging stations, recycling centers, sustainable shops, or public transport.
    Queries Google Places API if key is present, otherwise returns realistic mock locations near coords.
    """
    # Map input place types to Google Place keywords
    query_map = {
        "ev_charging": "electric vehicle charging station",
        "recycling": "recycling center",
        "public_transport": "bus station",
        "sustainable_shop": "organic food store"
    }
    
    search_query = query_map.get(place_type, "recycling center")
    
    if GOOGLE_MAPS_API_KEY:
        try:
            response = httpx.get(
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                params={
                    "location": f"{latitude},{longitude}",
                    "radius": 5000,
                    "keyword": search_query,
                    "key": GOOGLE_MAPS_API_KEY,
                },
                timeout=HTTP_TIMEOUT_SECONDS,
            )
            if response.status_code == 200:
                data = response.json()
                results = []
                for place in data.get("results", [])[:5]:
                    results.append({
                        "name": place.get("name"),
                        "address": place.get("vicinity"),
                        "latitude": place["geometry"]["location"]["lat"],
                        "longitude": place["geometry"]["location"]["lng"],
                        "rating": place.get("rating", 4.0),
                        "distance_km": round(haversine_distance(
                            latitude, longitude,
                            place["geometry"]["location"]["lat"],
                            place["geometry"]["location"]["lng"]
                        ), 2)
                    })
                return results
        except Exception as e:
            print(f"Error querying Google Places API: {e}")

    # Fallback/Mock sustainable locations around user coords
    mock_data = {
        "ev_charging": [
            {"name": "GreenCharge EV Hub", "address": "45 Eco Way, Metro City", "lat_offset": 0.012, "lon_offset": -0.008},
            {"name": "VoltPower Point", "address": "102 Energy Blvd, Metro City", "lat_offset": -0.015, "lon_offset": 0.011}
        ],
        "recycling": [
            {"name": "CleanLoop Recycling Center", "address": "78 Recycle Rd, Metro City", "lat_offset": 0.009, "lon_offset": 0.015},
            {"name": "EcoCycle Materials Yard", "address": "12 WasteLess Lane, Metro City", "lat_offset": -0.011, "lon_offset": -0.005}
        ],
        "public_transport": [
            {"name": "Central GreenLine Metro Station", "address": "Transit Plaza, Metro City", "lat_offset": 0.003, "lon_offset": -0.002},
            {"name": "EcoBus Rapid Hub", "address": "88 CleanAir St, Metro City", "lat_offset": 0.007, "lon_offset": 0.008}
        ],
        "sustainable_shop": [
            {"name": "Nature's Basket Organic Store", "address": "55 WholeFood Lane, Metro City", "lat_offset": -0.004, "lon_offset": -0.009},
            {"name": "ZeroWaste Bulk Grocers", "address": "33 Earth-First Way, Metro City", "lat_offset": 0.014, "lon_offset": 0.002}
        ]
    }
    
    results = []
    places = mock_data.get(place_type, mock_data["recycling"])
    for idx, p in enumerate(places):
        plat = latitude + p["lat_offset"]
        plon = longitude + p["lon_offset"]
        dist = haversine_distance(latitude, longitude, plat, plon)
        results.append({
            "name": p["name"],
            "address": p["address"],
            "latitude": plat,
            "longitude": plon,
            "rating": round(4.2 + (idx * 0.3), 1),
            "distance_km": round(dist, 2)
        })
        
    return results
