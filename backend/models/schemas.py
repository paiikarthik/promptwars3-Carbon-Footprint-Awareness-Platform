import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from carbon_engine.constants import COMMUTE_MODES, DIET_PREFERENCES, ENERGY_SOURCES

# Safe string validator to block basic script tags (XSS guard)
def sanitize_string(v: str) -> str:
    if re.search(r"<script.*?>.*?</script>|javascript:|onload=", v, re.IGNORECASE):
        raise ValueError("Potential script injection detected.")
    return v

def validate_choice(value: str, field_name: str, valid_choices: tuple[str, ...]) -> str:
    sanitize_string(value)
    if value not in valid_choices:
        raise ValueError(f"Invalid {field_name}. Must be one of {list(valid_choices)}")
    return value

class UserPreferencesSchema(BaseModel):
    commute_mode: str = "walk_cycle"
    commute_distance_km: float = Field(0.0, ge=0.0, le=1000.0)
    diet_preference: str = "balanced"
    home_energy_source: str = "mixed_grid"

    @field_validator("commute_mode")
    @classmethod
    def validate_commute_mode(cls, v: str) -> str:
        return validate_choice(v, "commute_mode", COMMUTE_MODES)

    @field_validator("diet_preference")
    @classmethod
    def validate_diet(cls, v: str) -> str:
        return validate_choice(v, "diet_preference", DIET_PREFERENCES)

    @field_validator("home_energy_source")
    @classmethod
    def validate_energy(cls, v: str) -> str:
        return validate_choice(v, "home_energy_source", ENERGY_SOURCES)

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
        return validate_choice(v, "commute_mode", COMMUTE_MODES)

    @field_validator("diet_preference")
    @classmethod
    def validate_diet(cls, v: str) -> str:
        return validate_choice(v, "diet_preference", DIET_PREFERENCES)

    @field_validator("home_energy_source")
    @classmethod
    def validate_energy(cls, v: str) -> str:
        return validate_choice(v, "home_energy_source", ENERGY_SOURCES)

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
        return validate_choice(v, "current_mode", COMMUTE_MODES)

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
