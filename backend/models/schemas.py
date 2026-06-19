from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class UserPreferencesSchema(BaseModel):
    commute_mode: str = "walk_cycle"
    commute_distance_km: float = 0.0
    diet_preference: str = "balanced"
    home_energy_source: str = "mixed_grid"

class UserUpdateSchema(BaseModel):
    displayName: Optional[str] = None
    email: Optional[str] = None
    location_enabled: Optional[bool] = None
    city: Optional[str] = None
    region: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferences: Optional[UserPreferencesSchema] = None

class CarbonLogInputSchema(BaseModel):
    commute_distance_km: float = Field(..., ge=0.0)
    commute_mode: str
    electricity_kwh: float = Field(..., ge=0.0)
    home_energy_source: str
    diet_preference: str
    shopping_purchases: int = Field(..., ge=0)
    waste_recycled: bool

class RouteAnalyzeRequest(BaseModel):
    origin: str
    destination: str
    current_mode: str = "petrol_bike"

class ChatRequestSchema(BaseModel):
    query: str
    user_id: str = "demo_user"

class LocationConsentSchema(BaseModel):
    enabled: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    region: Optional[str] = None
