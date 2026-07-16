from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol


class GeneratedImageExtension(StrEnum):
    PNG = ".png"
    JPEG = ".jpg"


@dataclass(frozen=True, slots=True)
class GeneratedImageResult:
    """Normalized payload returning from an AI provider."""

    image_bytes: bytes
    extension: GeneratedImageExtension
    provider_name: str
    provider_model: str
    seed: int | None = None


class AIProvider(Protocol):
    """Protocol for AI image generation providers."""

    async def generate(
        self,
        prompt: str,
        reference_image_bytes: bytes | list[bytes] | None = None,
        strength: float | None = None,
    ) -> GeneratedImageResult:
        """
        Generates an image from a prompt and an optional reference image.
        Must raise exceptions derived from ProviderError on failure.
        """
        ...
