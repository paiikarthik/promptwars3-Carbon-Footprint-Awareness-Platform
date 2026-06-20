import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional

# Safe string validator to block basic script tags (XSS guard)
def sanitize_string(v: str) -> str:
    if re.search(r"<script.*?>.*?</script>|javascript:|onload=", v, re.IGNORECASE):
        raise ValueError("Potential script injection detected.")
    return v

class UserPreferencesSchema(BaseModel):
    commute_mode: str = "walk_cycle"
    commute_distance_km: float = Field(0.0, ge=0.0, le=1000.0)
    diet_preference: str = "balanced"
    home_energy_source: str = "mixed_grid"

    @field_validator("commute_mode")
    @classmethod
    def validate_commute_mode(cls, v: str) -> str:
        sanitize_string(v)
        valid = ["petrol_bike", "diesel_car", "ev", "public_transit", "walk_cycle"]
        if v not in valid:
            raise ValueError(f"Invalid commute_mode. Must be one of {valid}")
        return v

    @field_validator("diet_preference")
    @classmethod
    def validate_diet(cls, v: str) -> str:
        sanitize_string(v)
        valid = ["meat_heavy", "balanced", "vegetarian", "vegan"]
        if v not in valid:
            raise ValueError(f"Invalid diet_preference. Must be one of {valid}")
        return v

    @field_validator("home_energy_source")
    @classmethod
    def validate_energy(cls, v: str) -> str:
        sanitize_string(v)
        valid = ["coal_grid", "mixed_grid", "solar"]
        if v not in valid:
            raise ValueError(f"Invalid home_energy_source. Must be one of {valid}")
        return v

class UserUpdateSchema(BaseModel):
    displayName: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    location_enabled: Optional[bool] = None
    city: Optional[str] = Field(None, max_length=50)
    region: Optional[str] = Field(None, max_length=50)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    preferences: Optional[UserPreferencesSchema] = None

    @field_validator("displayName", "email", "city", "region")
    @classmethod
    def check_xss(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            sanitize_string(v)
        return v

class CarbonLogInputSchema(BaseModel):
    commute_distance_km: float = Field(..., ge=0.0, le=1000.0)
    commute_mode: str
    electricity_kwh: float = Field(..., ge=0.0, le=500.0)
    home_energy_source: str
    diet_preference: str
    shopping_purchases: int = Field(..., ge=0, le=100)
    waste_recycled: bool

    @field_validator("commute_mode")
    @classmethod
    def validate_commute_mode(cls, v: str) -> str:
        sanitize_string(v)
        valid = ["petrol_bike", "diesel_car", "ev", "public_transit", "walk_cycle"]
        if v not in valid:
            raise ValueError(f"Invalid commute_mode. Must be one of {valid}")
        return v

    @field_validator("diet_preference")
    @classmethod
    def validate_diet(cls, v: str) -> str:
        sanitize_string(v)
        valid = ["meat_heavy", "balanced", "vegetarian", "vegan"]
        if v not in valid:
            raise ValueError(f"Invalid diet_preference. Must be one of {valid}")
        return v

    @field_validator("home_energy_source")
    @classmethod
    def validate_energy(cls, v: str) -> str:
        sanitize_string(v)
        valid = ["coal_grid", "mixed_grid", "solar"]
        if v not in valid:
            raise ValueError(f"Invalid home_energy_source. Must be one of {valid}")
        return v

class RouteAnalyzeRequest(BaseModel):
    origin: str = Field(..., max_length=100)
    destination: str = Field(..., max_length=100)
    current_mode: str = "petrol_bike"

    @field_validator("origin", "destination")
    @classmethod
    def check_xss(cls, v: str) -> str:
        sanitize_string(v)
        return v

    @field_validator("current_mode")
    @classmethod
    def validate_commute_mode(cls, v: str) -> str:
        sanitize_string(v)
        valid = ["petrol_bike", "diesel_car", "ev", "public_transit", "walk_cycle"]
        if v not in valid:
            raise ValueError(f"Invalid current_mode. Must be one of {valid}")
        return v

class ChatRequestSchema(BaseModel):
    query: str = Field(..., max_length=500)
    user_id: str = "demo_user"

    @field_validator("query", "user_id")
    @classmethod
    def check_xss(cls, v: str) -> str:
        sanitize_string(v)
        return v

class LocationConsentSchema(BaseModel):
    enabled: bool
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    city: Optional[str] = Field(None, max_length=50)
    region: Optional[str] = Field(None, max_length=50)

    @field_validator("city", "region")
    @classmethod
    def check_xss(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            sanitize_string(v)
        return v
