from datetime import datetime
from enum import StrEnum

from fastapi import UploadFile
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
    reference_image: UploadFile | None = None
    existing_reference_id: str | None = None
    sibling_id: str | None = None

    model_config = {"arbitrary_types_allowed": True}

    @model_validator(mode="after")
    def validate_form(self):
        stripped_prompt = self.prompt.strip()

        if self.prompt and len(stripped_prompt) < 3:
            raise ValueError("Prompt must be at least 3 characters if provided.")

        has_image = (
            self.reference_image is not None
            and self.reference_image.size is not None
            and self.reference_image.size > 0
        ) or bool(self.existing_reference_id)

        if not stripped_prompt and not has_image:
            raise ValueError(
                "Must provide either a prompt of at least 3 characters or a reference image."
            )

        # Clear empty reference_image so route handler doesn't try to process it
        if not has_image:
            self.reference_image = None

        return self


class AssetCreate(BaseModel):
    prompt: str = ""
    category: AssetCategory
    style: AssetStyle


class AssetEvolve(BaseModel):
    prompt: str = Field(min_length=3)
    category: AssetCategory
    style: AssetStyle


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
    sibling_id: str | None

    status: AssetStatus
    error_code: str | None
    error_message: str | None

    provider_name: str | None
    provider_model: str | None
    seed: int | None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
