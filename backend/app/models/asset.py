from datetime import datetime
from enum import StrEnum
from fastapi import UploadFile
from app.core.constants import MimeType

from pydantic import BaseModel, Field, model_validator


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


class AssetCreateForm(BaseModel):
    """Centralized Pydantic model for validating the multipart/form-data request shape and rules"""
    category: AssetCategory
    style: AssetStyle
    prompt: str = ""
    parent_id: str | None = None
    reference_image: UploadFile | None = None

    model_config = {"arbitrary_types_allowed": True}

    @model_validator(mode="after")
    def validate_form(self):
        if not self.prompt and not self.reference_image:
            raise ValueError("Must provide either a prompt or a reference image")
            
        if self.reference_image:
            if self.reference_image.content_type not in (MimeType.JPEG, MimeType.PNG):
                raise ValueError("Invalid file type. Only JPEG and PNG are supported.")
                
        return self


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
