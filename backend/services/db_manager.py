import os
import json
import threading
from datetime import datetime, timedelta

# Check if Firebase credentials are provided
FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")
use_firebase = False
db = None

# Global lock for thread-safe file operations
file_lock = threading.Lock()

if FIREBASE_CREDENTIALS:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Load from path or raw JSON string
        if os.path.exists(FIREBASE_CREDENTIALS):
            cred = credentials.Certificate(FIREBASE_CREDENTIALS)
        else:
            # Assume it's a JSON string
            cred_dict = json.loads(FIREBASE_CREDENTIALS)
            cred = credentials.Certificate(cred_dict)
            
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        use_firebase = True
        print("Firebase Admin successfully initialized. Using Firestore.")
    except Exception as e:
        print(f"Failed to initialize Firebase, falling back to local JSON database. Error: {e}")

# Local JSON Database Fallback Path
LOCAL_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "local_db.json")

def load_local_db() -> dict:
    with file_lock:
        if os.path.exists(LOCAL_DB_PATH):
            try:
                with open(LOCAL_DB_PATH, "r") as f:
                    return json.load(f)
            except Exception:
                pass
            
    # Default schema initialization
    default_db = {
        "users": {
            "demo_user": {
                "displayName": "Eco Pioneer",
                "email": "pioneer@ecoai.org",
                "createdAt": datetime.now().isoformat(),
                "location_enabled": True,
                "city": "Metro City",
                "region": "temperate",
                "latitude": 47.6062,
                "longitude": -122.3321,
                "preferences": {
                    "commute_mode": "petrol_bike",
                    "commute_distance_km": 15.0,
                    "diet_preference": "balanced",
                    "home_energy_source": "mixed_grid"
                },
                "points": 350,
                "xp": 1350,
                "level": 2,
                "streak": 5,
                "last_active_date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                "badges": [
                    {"id": "first_step", "name": "First Step", "description": "Completed first carbon log", "awardedAt": datetime.now().isoformat()},
                    {"id": "commute_champion", "name": "Commute Champ", "description": "Used public transit 3 days in a row", "awardedAt": datetime.now().isoformat()}
                ]
            }
        },
        "carbon_logs": {},
        "challenges": {
            "chal_1": {
                "id": "chal_1",
                "title": "Pedal Power Week",
                "description": "Cycle or walk for all commutes under 5km for a week.",
                "target_saving_kg": 12.5,
                "points_reward": 150,
                "category": "transport",
                "scope": "city",
                "scope_name": "Metro City",
                "participants": ["demo_user"],
                "completed_by": []
            },
            "chal_2": {
                "id": "chal_2",
                "title": "Plant-Based Feast",
                "description": "Log only vegetarian or vegan meals for 3 consecutive days.",
                "target_saving_kg": 7.2,
                "points_reward": 100,
                "category": "food",
                "scope": "global",
                "scope_name": "Global Community",
                "participants": [],
                "completed_by": []
            },
            "chal_3": {
                "id": "chal_3",
                "title": "Unplugged Evening",
                "description": "Reduce your household electricity use by 50% between 6 PM - 9 PM.",
                "target_saving_kg": 4.5,
                "points_reward": 80,
                "category": "energy",
                "scope": "workplace",
                "scope_name": "EcoCorp",
                "participants": ["demo_user"],
                "completed_by": ["demo_user"]
            }
        },
        "eco_twin": {
            "demo_user": {
                "current_status": {
                    "transportation_impact": "high",
                    "energy_impact": "medium",
                    "food_impact": "medium",
                    "lifestyle_impact": "low",
                    "overall_health_score": 62
                },
                "roadmap": [
                    {"week": 1, "milestone": "Transit Trial", "action": "Swap bike for bus 3 days this week", "target_saving": 7.5, "completed": True},
                    {"week": 2, "milestone": "Energy Audit", "action": "Turn off standby appliances at night", "target_saving": 3.0, "completed": False},
                    {"week": 3, "milestone": "Green Dining", "action": "Try two entirely plant-based dinners", "target_saving": 4.5, "completed": False},
                    {"week": 4, "milestone": "Waste Watch", "action": "Recycle all papers and plastic packaging", "target_saving": 2.0, "completed": False}
                ]
            }
        }
    }
    
    # Generate some mock carbon logs for the last 30 days
    from carbon_engine.calculator import calculate_total_footprint
    base_date = datetime.now() - timedelta(days=30)
    for i in range(30):
        log_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        # Simulate slight variations
        day_inputs = {
            "commute_distance_km": 15.0 if i % 7 != 0 and i % 7 != 6 else 0.0,
            "commute_mode": "petrol_bike" if i < 15 else "public_transit", # user improved halfway!
            "electricity_kwh": 8.0 + (i % 3) * 1.5,
            "home_energy_source": "mixed_grid",
            "diet_preference": "balanced",
            "shopping_purchases": 1 if i % 5 == 0 else 0,
            "waste_recycled": True if i % 2 == 0 else False
        }
        res = calculate_total_footprint(day_inputs)
        default_db["carbon_logs"][f"demo_user_{log_date}"] = {
            "userId": "demo_user",
            "date": log_date,
            "category_breakdown": res["category_breakdown"],
            "inputs": day_inputs,
            "total_emissions": res["total_emissions"],
            "carbon_score": res["carbon_score"]
        }
        
    save_local_db(default_db)
    return default_db

def save_local_db(data: dict):
    with file_lock:
        try:
            with open(LOCAL_DB_PATH, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving local database: {e}")

# Database APIs that route to Firestore or Local DB

def get_user(user_id: str) -> dict:
    if use_firebase:
        doc = db.collection("users").document(user_id).get()
        return doc.to_dict() if doc.exists else None
    else:
        local_db = load_local_db()
        return local_db["users"].get(user_id)

def update_user(user_id: str, updates: dict) -> dict:
    if use_firebase:
        ref = db.collection("users").document(user_id)
        ref.set(updates, merge=True)
        return ref.get().to_dict()
    else:
        local_db = load_local_db()
        if user_id not in local_db["users"]:
            # initialize
            local_db["users"][user_id] = {
                "displayName": "Eco Warrior",
                "email": "user@eco.com",
                "createdAt": datetime.now().isoformat(),
                "location_enabled": True,
                "city": "Metro City",
                "region": "temperate",
                "latitude": 47.6062,
                "longitude": -122.3321,
                "preferences": {
                    "commute_mode": "walk_cycle",
                    "commute_distance_km": 0.0,
                    "diet_preference": "balanced",
                    "home_energy_source": "mixed_grid"
                },
                "points": 0,
                "xp": 0,
                "level": 1,
                "streak": 0,
                "badges": []
            }
        
        # Merge updates
        for k, v in updates.items():
            if isinstance(v, dict) and k in local_db["users"][user_id] and isinstance(local_db["users"][user_id][k], dict):
                local_db["users"][user_id][k].update(v)
            else:
                local_db["users"][user_id][k] = v
                
        save_local_db(local_db)
        return local_db["users"][user_id]

def get_carbon_logs(user_id: str) -> list:
    if use_firebase:
        docs = db.collection("carbon_logs").where("userId", "==", user_id).stream()
        return [doc.to_dict() for doc in docs]
    else:
        local_db = load_local_db()
        return [log for log in local_db["carbon_logs"].values() if log["userId"] == user_id]

def save_carbon_log(user_id: str, date_str: str, log_data: dict) -> dict:
    if use_firebase:
        log_id = f"{user_id}_{date_str}"
        db.collection("carbon_logs").document(log_id).set(log_data)
        return log_data
    else:
        local_db = load_local_db()
        log_id = f"{user_id}_{date_str}"
        log_data["userId"] = user_id
        log_data["date"] = date_str
        local_db["carbon_logs"][log_id] = log_data
        
        # Also update the user's gamification points/streaks when they log
        user = local_db["users"].get(user_id)
        if user:
            # Update streaks
            last_active = user.get("last_active_date")
            today = datetime.now().strftime("%Y-%m-%d")
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            
            if last_active == yesterday:
                user["streak"] = user.get("streak", 0) + 1
            elif last_active != today:
                user["streak"] = 1
                
            user["last_active_date"] = today
            # Add points for logging (e.g. +10 points)
            user["points"] = user.get("points", 0) + 10
            user["xp"] = user.get("xp", 0) + 50
            
            # Level up check (every 500 XP = 1 Level)
            user["level"] = (user["xp"] // 500) + 1
            
            # Check for badges
            existing_badge_ids = {b["id"] for b in user.get("badges", [])}
            if user["streak"] >= 5 and "streak_5" not in existing_badge_ids:
                user["badges"].append({
                    "id": "streak_5",
                    "name": "Streak Master",
                    "description": "Logged emissions for 5 consecutive days",
                    "awardedAt": datetime.now().isoformat()
                })
                user["points"] += 100
                
            local_db["users"][user_id] = user
            
        save_local_db(local_db)
        return log_data

def get_eco_twin(user_id: str) -> dict:
    if use_firebase:
        doc = db.collection("eco_twin").document(user_id).get()
        return doc.to_dict() if doc.exists else None
    else:
        local_db = load_local_db()
        if user_id not in local_db["eco_twin"]:
            # Auto-generate baseline twin
            local_db["eco_twin"][user_id] = {
                "current_status": {
                    "transportation_impact": "medium",
                    "energy_impact": "medium",
                    "food_impact": "medium",
                    "lifestyle_impact": "medium",
                    "overall_health_score": 50
                },
                "roadmap": [
                    {"week": 1, "milestone": "Green Commute", "action": "Walk or cycle for short journeys", "target_saving": 5.0, "completed": False},
                    {"week": 2, "milestone": "AC Saver", "action": "Set AC cooling to 24 degrees C", "target_saving": 6.5, "completed": False},
                    {"week": 3, "milestone": "Veggie Switch", "action": "Swap meat for vegetables in 3 dinners", "target_saving": 4.0, "completed": False}
                ]
            }
            save_local_db(local_db)
        return local_db["eco_twin"].get(user_id)

def update_eco_twin(user_id: str, updates: dict) -> dict:
    if use_firebase:
        ref = db.collection("eco_twin").document(user_id)
        ref.set(updates, merge=True)
        return ref.get().to_dict()
    else:
        local_db = load_local_db()
        if user_id not in local_db["eco_twin"]:
            get_eco_twin(user_id) # initializes
            local_db = load_local_db()
            
        for k, v in updates.items():
            if isinstance(v, dict) and k in local_db["eco_twin"][user_id]:
                local_db["eco_twin"][user_id][k].update(v)
            else:
                local_db["eco_twin"][user_id][k] = v
        save_local_db(local_db)
        return local_db["eco_twin"][user_id]

def get_challenges() -> list:
    if use_firebase:
        docs = db.collection("community_challenges").stream()
        return [doc.to_dict() for doc in docs]
    else:
        local_db = load_local_db()
        return list(local_db["challenges"].values())

def join_challenge(challenge_id: str, user_id: str) -> dict:
    if use_firebase:
        ref = db.collection("community_challenges").document(challenge_id)
        # Using transactional operations in real setup, simpler here
        doc = ref.get()
        if doc.exists:
            chal = doc.to_dict()
            if user_id not in chal.get("participants", []):
                chal.setdefault("participants", []).append(user_id)
                ref.set(chal)
            return chal
        return None
    else:
        local_db = load_local_db()
        chal = local_db["challenges"].get(challenge_id)
        if chal:
            if user_id not in chal.setdefault("participants", []):
                chal["participants"].append(user_id)
            save_local_db(local_db)
        return chal

def complete_challenge(challenge_id: str, user_id: str) -> dict:
    if use_firebase:
        ref = db.collection("community_challenges").document(challenge_id)
        doc = ref.get()
        if doc.exists:
            chal = doc.to_dict()
            if user_id not in chal.get("completed_by", []):
                chal.setdefault("completed_by", []).append(user_id)
                ref.set(chal)
            return chal
        return None
    else:
        local_db = load_local_db()
        chal = local_db["challenges"].get(challenge_id)
        if chal:
            if user_id not in chal.setdefault("completed_by", []):
                chal["completed_by"].append(user_id)
                # Reward user
                user = local_db["users"].get(user_id)
                if user:
                    user["points"] = user.get("points", 0) + chal.get("points_reward", 50)
                    user["xp"] = user.get("xp", 0) + (chal.get("points_reward", 50) * 4)
                    user["level"] = (user["xp"] // 500) + 1
                    
                    # Award a challenge badge if this is their first completion
                    existing_badge_ids = {b["id"] for b in user.get("badges", [])}
                    if "challenge_winner" not in existing_badge_ids:
                        user["badges"].append({
                            "id": "challenge_winner",
                            "name": "Eco Champion",
                            "description": "Completed first community carbon challenge",
                            "awardedAt": datetime.now().isoformat()
                        })
                    local_db["users"][user_id] = user
            save_local_db(local_db)
        return chal

def get_leaderboard() -> list:
    """
    Ranks users by Carbon Saved (gamified, points / emissions saved).
    Since we have mock users and users can improve, we generate a nice ranks list.
    """
    leaderboard_list = []
    
    if use_firebase:
        try:
            users_docs = db.collection("users").stream()
            users = {doc.id: doc.to_dict() for doc in users_docs}
            logs_docs = db.collection("carbon_logs").stream()
            logs_list = [doc.to_dict() for doc in logs_docs]
            
            for uid, u in users.items():
                u_logs = [log for log in logs_list if log.get("userId") == uid]
                saved_co2 = 0.0
                if u_logs:
                    avg_log_emissions = sum(log.get("total_emissions", 0.0) for log in u_logs) / len(u_logs)
                    saved_co2 = max(0.0, (15.0 - avg_log_emissions) * len(u_logs))
                else:
                    saved_co2 = (u.get("points", 0) * 0.1)
                    
                leaderboard_list.append({
                    "userId": uid,
                    "displayName": u.get("displayName", "Eco Warrior"),
                    "city": u.get("city", "Metro City"),
                    "carbon_saved_kg": round(saved_co2, 1),
                    "points": u.get("points", 0),
                    "streak": u.get("streak", 0)
                })
        except Exception as e:
            print(f"Error building Firestore leaderboard: {e}")
    else:
        local_db = load_local_db()
        users = local_db["users"]
        for uid, u in users.items():
            logs = [log for log in local_db["carbon_logs"].values() if log["userId"] == uid]
            saved_co2 = 0.0
            if logs:
                avg_log_emissions = sum(log["total_emissions"] for log in logs) / len(logs)
                saved_co2 = max(0.0, (15.0 - avg_log_emissions) * len(logs))
            else:
                saved_co2 = (u.get("points", 0) * 0.1)
                
            leaderboard_list.append({
                "userId": uid,
                "displayName": u["displayName"],
                "city": u.get("city", "Metro City"),
                "carbon_saved_kg": round(saved_co2, 1),
                "points": u.get("points", 0),
                "streak": u.get("streak", 0)
            })
        
    # Inject 4 mock contenders to make the community leaderboard look rich and competitive!
    mock_competitors = [
        {"userId": "mock1", "displayName": "Sierra Green", "city": "Metro City", "carbon_saved_kg": 142.5, "points": 1820, "streak": 14},
        {"userId": "mock2", "displayName": "Alex Cycle", "city": "Metro City", "carbon_saved_kg": 115.8, "points": 1450, "streak": 8},
        {"userId": "mock3", "displayName": "Eco Student 22", "city": "Metro City", "carbon_saved_kg": 85.2, "points": 920, "streak": 3},
        {"userId": "mock4", "displayName": "Solar Homeowner", "city": "Metro City", "carbon_saved_kg": 54.0, "points": 650, "streak": 12}
    ]
    leaderboard_list.extend(mock_competitors)
    
    # Sort by carbon saved
    leaderboard_list = sorted(leaderboard_list, key=lambda x: x["carbon_saved_kg"], reverse=True)
    for index, entry in enumerate(leaderboard_list):
        entry["rank"] = index + 1
        
    return leaderboard_list

def delete_carbon_log(user_id: str, date_str: str) -> bool:
    if use_firebase:
        try:
            log_id = f"{user_id}_{date_str}"
            db.collection("carbon_logs").document(log_id).delete()
            # Invalidate predictions cache
            ref = db.collection("users").document(user_id)
            user_doc = ref.get()
            if user_doc.exists:
                ref.update({"cached_predictions": None})
            return True
        except Exception:
            return False
    else:
        local_db = load_local_db()
        log_id = f"{user_id}_{date_str}"
        if log_id in local_db["carbon_logs"]:
            del local_db["carbon_logs"][log_id]
            if user_id in local_db["users"]:
                local_db["users"][user_id]["cached_predictions"] = None
            save_local_db(local_db)
            return True
        return False

def delete_user_data(user_id: str):
    if use_firebase:
        # Delete user logs
        logs = db.collection("carbon_logs").where("userId", "==", user_id).stream()
        for log in logs:
            db.collection("carbon_logs").document(log.id).delete()
        # Delete twin
        db.collection("eco_twin").document(user_id).delete()
        # Delete user
        db.collection("users").document(user_id).delete()
    else:
        local_db = load_local_db()
        if user_id in local_db["users"]:
            del local_db["users"][user_id]
        if user_id in local_db["eco_twin"]:
            del local_db["eco_twin"][user_id]
        # Remove logs
        local_db["carbon_logs"] = {k: v for k, v in local_db["carbon_logs"].items() if v["userId"] != user_id}
        save_local_db(local_db)
