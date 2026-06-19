from fastapi import APIRouter, HTTPException, Query
from models.schemas import (
    UserUpdateSchema, 
    CarbonLogInputSchema, 
    RouteAnalyzeRequest, 
    ChatRequestSchema
)
from services import db_manager, location
from carbon_engine import calculator, predictor
from ai_engine import ecobuddy
from datetime import datetime

router = APIRouter()

@router.get("/user/{user_id}")
async def get_user_profile(user_id: str):
    user = db_manager.get_user(user_id)
    if not user:
        # Create a new user with this ID
        user = db_manager.update_user(user_id, {})
        
    # Calculate historical logging averages to power Smart Flow inputs
    logs = db_manager.get_carbon_logs(user_id)
    avg_dist = 15.0
    avg_elec = 8.0
    
    if logs:
        # Average distance excludes walk/cycle (0 km) to prevent skews on vehicle entries
        vehicle_logs = [l for l in logs if l["inputs"].get("commute_mode") != "walk_cycle"]
        if vehicle_logs:
            avg_dist = sum(l["inputs"].get("commute_distance_km", 15.0) for l in vehicle_logs) / len(vehicle_logs)
        else:
            avg_dist = 0.0
        avg_elec = sum(l["inputs"].get("electricity_kwh", 8.0) for l in logs) / len(logs)
        
    user["historical_averages"] = {
        "commute_distance_km": round(avg_dist, 1),
        "electricity_kwh": round(avg_elec, 1)
    }
    return user

@router.post("/user/{user_id}")
async def update_user_profile(user_id: str, updates: UserUpdateSchema):
    update_dict = updates.model_dump(exclude_unset=True)
    updated_user = db_manager.update_user(user_id, update_dict)
    return updated_user

@router.get("/carbon/history/{user_id}")
async def get_carbon_history(user_id: str):
    logs = db_manager.get_carbon_logs(user_id)
    sorted_logs = sorted(logs, key=lambda x: x["date"], reverse=True)
    
    avg_emissions = 0.0
    avg_score = 0.0
    if sorted_logs:
        avg_emissions = sum(log["total_emissions"] for log in sorted_logs) / len(sorted_logs)
        avg_score = sum(log["carbon_score"] for log in sorted_logs) / len(sorted_logs)
        
    return {
        "logs": sorted_logs,
        "summary": {
            "average_daily_co2": round(avg_emissions, 2),
            "average_carbon_score": int(avg_score),
            "total_logs_count": len(sorted_logs)
        }
    }

@router.post("/carbon/log/{user_id}/{date_str}")
async def log_carbon_emissions(user_id: str, date_str: str, inputs: CarbonLogInputSchema):
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
    # Calculate emissions
    result = calculator.calculate_total_footprint(inputs.model_dump())
    
    log_data = {
        "category_breakdown": result["category_breakdown"],
        "inputs": inputs.model_dump(),
        "total_emissions": result["total_emissions"],
        "carbon_score": result["carbon_score"]
    }
    
    saved_log = db_manager.save_carbon_log(user_id, date_str, log_data)
    
    # 1. Update the Eco Digital Twin
    twin = db_manager.get_eco_twin(user_id)
    if twin:
        status = twin["current_status"]
        status["transportation_impact"] = "high" if result["category_breakdown"]["transportation"] > 4.0 else ("medium" if result["category_breakdown"]["transportation"] > 1.5 else "low")
        status["energy_impact"] = "high" if result["category_breakdown"]["energy"] > 6.0 else ("medium" if result["category_breakdown"]["energy"] > 2.5 else "low")
        status["food_impact"] = "high" if result["category_breakdown"]["food"] > 5.0 else ("medium" if result["category_breakdown"]["food"] > 2.0 else "low")
        status["lifestyle_impact"] = "high" if result["category_breakdown"]["lifestyle"] > 3.0 else ("medium" if result["category_breakdown"]["lifestyle"] > 1.0 else "low")
        status["overall_health_score"] = result["carbon_score"]
        
        for milestone in twin.get("roadmap", []):
            if milestone["week"] == 1 and inputs.commute_mode in ["public_transit", "walk_cycle"] and not milestone["completed"]:
                milestone["completed"] = True
                milestone["completedAt"] = datetime.now().isoformat()
                
        db_manager.update_eco_twin(user_id, twin)
        
    # 2. Pre-calculate and cache the ML predictions inside the user profile document (Write Optimization)
    try:
        user = db_manager.get_user(user_id)
        if user:
            updated_logs = db_manager.get_carbon_logs(user_id)
            user_profile = {
                "region": user.get("region", "temperate"),
                "diet_preference": user.get("preferences", {}).get("diet_preference", "balanced"),
                "commute_distance_km": user.get("preferences", {}).get("commute_distance_km", 15.0),
                "commute_mode": user.get("preferences", {}).get("commute_mode", "petrol_bike")
            }
            prediction = predictor.predict_next_month_emissions(updated_logs, user_profile)
            db_manager.update_user(user_id, {"cached_predictions": prediction})
    except Exception as e:
        # Non-blocking prediction caching error safeguard
        print(f"Failed to pre-compute and cache predictions: {e}")
        
    return saved_log

@router.get("/carbon/predict/{user_id}")
async def get_carbon_prediction(user_id: str):
    user = db_manager.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # Read from cache if present (Instant O(1) retrieval)
    cached = user.get("cached_predictions")
    if cached:
        return cached
        
    # Compute on the fly if cache is not built yet (e.g. new session)
    logs = db_manager.get_carbon_logs(user_id)
    user_profile = {
        "region": user.get("region", "temperate"),
        "diet_preference": user.get("preferences", {}).get("diet_preference", "balanced"),
        "commute_distance_km": user.get("preferences", {}).get("commute_distance_km", 15.0),
        "commute_mode": user.get("preferences", {}).get("commute_mode", "petrol_bike")
    }
    
    prediction = predictor.predict_next_month_emissions(logs, user_profile)
    db_manager.update_user(user_id, {"cached_predictions": prediction})
    return prediction

@router.post("/location/analyze")
async def analyze_route(req: RouteAnalyzeRequest):
    result = location.analyze_route_emissions(req.origin, req.destination, req.current_mode)
    return result

@router.get("/location/nearby")
async def get_nearby_places(
    latitude: float = Query(...), 
    longitude: float = Query(...), 
    place_type: str = Query(...)
):
    valid_types = ["ev_charging", "recycling", "public_transport", "sustainable_shop"]
    if place_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid place_type. Choose from {valid_types}")
        
    places = location.find_nearby_sustainable_places(latitude, longitude, place_type)
    return places

@router.post("/ai/chat")
async def chat_with_ecobuddy(req: ChatRequestSchema):
    user = db_manager.get_user(req.user_id)
    user_context = {}
    
    if user:
        logs = db_manager.get_carbon_logs(req.user_id)
        avg_score = 70
        avg_daily_co2 = 12.0
        if logs:
            avg_score = int(sum(l["carbon_score"] for l in logs) / len(logs))
            avg_daily_co2 = sum(l["total_emissions"] for l in logs) / len(logs)
            
        user_context = {
            "displayName": user.get("displayName", "Eco Warrior"),
            "city": user.get("city", "Metro City"),
            "carbon_score": avg_score,
            "current_daily_co2": round(avg_daily_co2, 2),
            "commute_distance_km": user.get("preferences", {}).get("commute_distance_km", 15.0),
            "commute_mode": user.get("preferences", {}).get("commute_mode", "petrol_bike"),
            "diet_preference": user.get("preferences", {}).get("diet_preference", "balanced")
        }
        
    reply = ecobuddy.ask_ecobuddy(req.query, user_context)
    return {"reply": reply}

@router.get("/challenges")
async def list_challenges():
    return db_manager.get_challenges()

@router.post("/challenges/{challenge_id}/join/{user_id}")
async def join_challenge_route(challenge_id: str, user_id: str):
    res = db_manager.join_challenge(challenge_id, user_id)
    if not res:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    return res

@router.post("/challenges/{challenge_id}/complete/{user_id}")
async def complete_challenge_route(challenge_id: str, user_id: str):
    res = db_manager.complete_challenge(challenge_id, user_id)
    if not res:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    return res

@router.get("/eco-twin/{user_id}")
async def get_user_eco_twin(user_id: str):
    twin = db_manager.get_eco_twin(user_id)
    if not twin:
        raise HTTPException(status_code=404, detail="Eco Twin profile not found.")
    return twin

@router.get("/leaderboard")
async def get_community_leaderboard():
    return db_manager.get_leaderboard()

@router.delete("/user/delete/{user_id}")
async def delete_user(user_id: str):
    db_manager.delete_user_data(user_id)
    return {"status": "success", "message": "All user carbon logs, profile data, and Eco Twin states deleted."}
