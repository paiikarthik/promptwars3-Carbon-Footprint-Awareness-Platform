import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

def get_seasonal_factor(month: int, region: str = "temperate") -> float:
    """
    Returns a carbon scaling factor for energy/lifestyle based on month.
    Temperate zones use more heating in winter (Dec, Jan, Feb) and cooling in summer (Jun, Jul, Aug).
    Tropical zones use cooling all year but peak in hot months.
    """
    # Simple sine wave representing temperature seasonality
    # Peaks in summer (July = 7) and troughs in winter (Jan = 1)
    if region == "tropical":
        # Hotter in summer, but relatively stable
        seasonal_factors = {
            1: 0.95, 2: 1.0, 3: 1.05, 4: 1.10, 5: 1.15, 6: 1.10,
            7: 1.05, 8: 1.05, 9: 1.0, 10: 0.95, 11: 0.90, 12: 0.90
        }
    else: # temperate
        # High heating/cooling in winter and summer
        seasonal_factors = {
            1: 1.25, 2: 1.20, 3: 1.00, 4: 0.90, 5: 0.95, 6: 1.15,
            7: 1.30, 8: 1.25, 9: 1.00, 10: 0.90, 11: 1.10, 12: 1.25
        }
    return seasonal_factors.get(month, 1.0)

def generate_synthetic_history(user_base_daily: float, days: int = 60, region: str = "temperate") -> list:
    """
    Generates realistic historical carbon log sequence for training.
    """
    history = []
    base_date = datetime.now() - timedelta(days=days)
    
    for i in range(days):
        current_date = base_date + timedelta(days=i)
        month = current_date.month
        # Add random noise and seasonal factor
        seasonal = get_seasonal_factor(month, region)
        noise = np.random.normal(0, 1.5) # std deviation of 1.5 kg
        daily_val = max(1.5, (user_base_daily * seasonal) + noise)
        
        # Add weekly travel pattern (higher emissions on weekdays, lower on weekends)
        weekday = current_date.weekday()
        if weekday < 5:  # Weekday
            daily_val += np.random.uniform(0.5, 2.0)
        else:            # Weekend
            daily_val -= np.random.uniform(0.5, 1.5)
            
        history.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "total_emissions": round(max(1.0, daily_val), 2)
        })
    return history

def predict_next_month_emissions(historical_logs: list, user_profile: dict) -> dict:
    """
    Trains a LinearRegression model on past user data to forecast next month's footprint.
    If historical data is sparse, synthetic data is used to bootstrap training.
    
    Args:
        historical_logs: List of dicts containing {"date": "YYYY-MM-DD", "total_emissions": float}
        user_profile: Dict containing preferences (region, default travel distance, etc.)
    """
    region = user_profile.get("region", "temperate")
    base_commute = user_profile.get("commute_distance_km", 15.0)
    base_mode = user_profile.get("commute_mode", "petrol_bike")
    
    # 1. Prepare and clean data
    logs_df = pd.DataFrame(historical_logs)
    
    # Bootstrap with synthetic history if there are less than 15 logs
    if logs_df.empty or len(logs_df) < 15:
        # Determine average base daily footprint from calculator
        # Simple estimate based on lifestyle
        diet = user_profile.get("diet_preference", "balanced")
        diet_baselines = {"meat_heavy": 8.0, "balanced": 5.0, "vegetarian": 2.5, "vegan": 1.5}
        base_food = diet_baselines.get(diet, 5.0)
        
        # Est transport base
        modes = {"petrol_bike": 0.12, "diesel_car": 0.18, "ev": 0.05, "public_transit": 0.04, "walk_cycle": 0.0}
        base_transport = base_commute * modes.get(base_mode, 0.12)
        
        calculated_base = base_food + base_transport + 3.0  # (estimated average electricity + lifestyle)
        synthetic_logs = generate_synthetic_history(calculated_base, days=60, region=region)
        
        if not logs_df.empty:
            # Combine real logs with synthetic logs to pad
            synth_df = pd.DataFrame(synthetic_logs)
            # Remove dates that overlap with real logs
            synth_df = synth_df[~synth_df["date"].isin(logs_df["date"])]
            logs_df = pd.concat([logs_df, synth_df], ignore_index=True)
        else:
            logs_df = pd.DataFrame(synthetic_logs)
            
    # Convert date to datetime and sort
    logs_df["date"] = pd.to_datetime(logs_df["date"])
    logs_df = logs_df.sort_values("date").reset_index(drop=True)
    
    # 2. Extract features
    # Let's predict emissions using: Day of week, Month (as seasonal factor), and Day Index
    logs_df["day_index"] = np.arange(len(logs_df))
    logs_df["month"] = logs_df["date"].dt.month
    logs_df["day_of_week"] = logs_df["date"].dt.dayofweek
    logs_df["seasonal_factor"] = logs_df["month"].apply(lambda m: get_seasonal_factor(m, region))
    
    X = logs_df[["day_index", "day_of_week", "seasonal_factor"]]
    y = logs_df["total_emissions"]
    
    # 3. Train Model
    model = LinearRegression()
    model.fit(X, y)
    
    # 4. Predict Next 30 Days
    next_month_days = []
    last_date = logs_df["date"].max()
    last_day_index = logs_df["day_index"].max()
    
    for i in range(1, 31):
        future_date = last_date + timedelta(days=i)
        future_day_index = last_day_index + i
        future_month = future_date.month
        future_day_of_week = future_date.weekday()
        future_seasonal = get_seasonal_factor(future_month, region)
        
        next_month_days.append({
            "day_index": future_day_index,
            "day_of_week": future_day_of_week,
            "seasonal_factor": future_seasonal,
            "date": future_date
        })
        
    future_df = pd.DataFrame(next_month_days)
    predictions = model.predict(future_df[["day_index", "day_of_week", "seasonal_factor"]])
    
    # Add bounds to make predictions realistic
    predictions = np.clip(predictions, a_min=1.0, a_max=60.0)
    future_df["predicted_emissions"] = predictions
    
    # Calculate totals
    current_month_total = logs_df.tail(30)["total_emissions"].sum()
    next_month_predicted_total = future_df["predicted_emissions"].sum()
    
    # Formulate reason
    difference = next_month_predicted_total - current_month_total
    
    # Identify key reasons
    next_month_num = (datetime.now() + timedelta(days=30)).month
    current_month_num = datetime.now().month
    current_seasonal = get_seasonal_factor(current_month_num, region)
    next_seasonal = get_seasonal_factor(next_month_num, region)
    
    reason = "Expected baseline activity holds steady."
    if next_seasonal > current_seasonal:
        reason = "Increased emissions predicted due to seasonal heating/cooling changes as temperature shifts."
    elif next_seasonal < current_seasonal:
        reason = "Slightly lower emissions predicted due to milder seasonal weather requiring less air-conditioning or heating."
    
    if difference > 15.0 and next_seasonal >= current_seasonal:
        reason = "Higher overall carbon footprint predicted. This is driven by upcoming seasonal weather factors and recent consumption patterns."
    elif difference < -15.0:
        reason = "Lower overall carbon footprint expected due to favorable seasonal climate and positive trends in your usage patterns."
        
    return {
        "current_month_total": round(float(current_month_total), 2),
        "predicted_next_month_total": round(float(next_month_predicted_total), 2),
        "difference": round(float(difference), 2),
        "difference_pct": round(float((difference / max(1.0, current_month_total)) * 100), 1),
        "reason": reason,
        "weekly_predictions": [
            {
                "week": f"Week {w+1}",
                "emissions": round(float(future_df.iloc[w*7 : (w+1)*7]["predicted_emissions"].sum()), 2)
            } for w in range(4)
        ]
    }
