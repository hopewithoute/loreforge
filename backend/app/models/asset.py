from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class AssetCategory(StrEnum):
    environment = "environment"
    character = "character"
    prop = "prop"


class AssetStyle(StrEnum):
    concept_art = "concept_art"
    isometric_rpg = "isometric_rpg"
    pixel_art = "pixel_art"
    dark_fantasy = "dark_fantasy"


class AssetStatus(StrEnum):
    pending = "pending"
    success = "success"
    failed = "failed"


class AssetCreate(BaseModel):
    prompt: str = ""
    category: AssetCategory
    style: AssetStyle
    parent_id: str | None = None


class AssetRead(BaseModel):
    id: str
    user_id: str
    category: AssetCategory
    style: AssetStyle
    prompt: str

    reference_image_path: str | None
    prepared_input_path: str | None
    generated_image_path: str | None
    parent_id: str | None

    status: AssetStatus
    error_code: str | None
    error_message: str | None

    provider_name: str | None
    provider_model: str | None
    seed: int | None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
