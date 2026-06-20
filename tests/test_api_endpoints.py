from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"

def test_rejects_script_injection():
    response = client.post(
        "/api/ai/chat",
        json={"query": "<script>alert('xss')</script>", "user_id": "demo_user"},
    )
    assert response.status_code == 422

def test_rejects_invalid_carbon_log_date():
    response = client.post(
        "/api/carbon/log/test_user_99/20-06-2026",
        json={
            "commute_distance_km": 10.0,
            "commute_mode": "diesel_car",
            "electricity_kwh": 5.0,
            "home_energy_source": "mixed_grid",
            "diet_preference": "balanced",
            "shopping_purchases": 1,
            "waste_recycled": True,
        },
    )
    assert response.status_code == 400

def test_user_endpoints():
    # Test GET user (creates if not existing)
    response = client.get("/api/user/test_user_99")
    assert response.status_code == 200
    assert "displayName" in response.json()
    
    # Test POST user update
    updates = {
        "displayName": "Test Eco Warrior",
        "email": "test@eco.com",
        "location_enabled": True,
        "city": "Green City",
        "region": "temperate",
        "preferences": {
            "commute_mode": "ev",
            "commute_distance_km": 25.0,
            "diet_preference": "vegan",
            "home_energy_source": "solar"
        }
    }
    response = client.post("/api/user/test_user_99", json=updates)
    assert response.status_code == 200
    data = response.json()
    assert data["displayName"] == "Test Eco Warrior"
    assert data["preferences"]["diet_preference"] == "vegan"

def test_carbon_log_endpoints():
    log_input = {
        "commute_distance_km": 10.0,
        "commute_mode": "diesel_car",
        "electricity_kwh": 5.0,
        "home_energy_source": "mixed_grid",
        "diet_preference": "balanced",
        "shopping_purchases": 1,
        "waste_recycled": True
    }
    # Log for specific date
    response = client.post("/api/carbon/log/test_user_99/2026-06-19", json=log_input)
    assert response.status_code == 200
    data = response.json()
    assert data["total_emissions"] > 0
    assert "carbon_score" in data
    
    # Get history
    history_resp = client.get("/api/carbon/history/test_user_99")
    assert history_resp.status_code == 200
    hist = history_resp.json()
    assert hist["summary"]["total_logs_count"] >= 1
    assert hist["logs"][0]["date"] == "2026-06-19"

def test_prediction_endpoint():
    response = client.get("/api/carbon/predict/test_user_99")
    assert response.status_code == 200
    data = response.json()
    assert "predicted_next_month_total" in data
    assert "reason" in data

def test_location_endpoints():
    # Route analyze
    route_req = {
        "origin": "Green Street",
        "destination": "College Road",
        "current_mode": "diesel_car"
    }
    response = client.post("/api/location/analyze", json=route_req)
    assert response.status_code == 200
    data = response.json()
    assert "distance_km" in data
    assert len(data["modes_comparison"]) > 0
    
    # Nearby places
    response = client.get("/api/location/nearby?latitude=47.6062&longitude=-122.3321&place_type=recycling")
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_ai_chat_endpoint():
    chat_req = {
        "query": "Should I buy an electric bike?",
        "user_id": "test_user_99"
      }
    response = client.post("/api/ai/chat", json=chat_req)
    assert response.status_code == 200
    assert "reply" in response.json()

def test_challenges_endpoints():
    # Get challenges
    response = client.get("/api/challenges")
    assert response.status_code == 200
    challenges = response.json()
    assert len(challenges) > 0
    
    challenge_id = challenges[0]["id"]
    
    # Join challenge
    join_resp = client.post(f"/api/challenges/{challenge_id}/join/test_user_99")
    assert join_resp.status_code == 200
    assert "test_user_99" in join_resp.json()["participants"]
    
    # Complete challenge
    complete_resp = client.post(f"/api/challenges/{challenge_id}/complete/test_user_99")
    assert complete_resp.status_code == 200
    assert "test_user_99" in complete_resp.json()["completed_by"]

def test_insights_endpoint():
    # Fetch insights for test_user_99
    response = client.get("/api/carbon/insights/test_user_99")
    assert response.status_code == 200
    data = response.json()
    assert "highest_category" in data
    assert "insight" in data
    assert "breakdown" in data

def test_delete_single_log():
    # Log a temporary footprint
    log_input = {
        "commute_distance_km": 5.0,
        "commute_mode": "walk_cycle",
        "electricity_kwh": 3.0,
        "home_energy_source": "solar",
        "diet_preference": "vegan",
        "shopping_purchases": 0,
        "waste_recycled": True
    }
    log_response = client.post("/api/carbon/log/test_user_99/2026-06-18", json=log_input)
    assert log_response.status_code == 200
    
    # Verify it exists
    history_resp = client.get("/api/carbon/history/test_user_99")
    assert history_resp.status_code == 200
    dates = [log["date"] for log in history_resp.json()["logs"]]
    assert "2026-06-18" in dates
    
    # Delete it
    delete_resp = client.delete("/api/carbon/log/test_user_99/2026-06-18")
    assert delete_resp.status_code == 200
    
    # Verify it is deleted
    history_resp2 = client.get("/api/carbon/history/test_user_99")
    assert history_resp2.status_code == 200
    dates2 = [log["date"] for log in history_resp2.json()["logs"]]
    assert "2026-06-18" not in dates2

def test_delete_user_endpoint():
    # Verify user exists first
    response = client.get("/api/user/test_user_99")
    assert response.status_code == 200
    
    # Delete
    del_response = client.delete("/api/user/delete/test_user_99")
    assert del_response.status_code == 200
    
    # Verify logs deleted
    history_resp = client.get("/api/carbon/history/test_user_99")
    assert history_resp.status_code == 200
    assert history_resp.json()["summary"]["total_logs_count"] == 0
