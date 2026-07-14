from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class GeneratedImageResult:
    """Normalized payload returning from an AI provider."""

    image_bytes: bytes
    provider_name: str
    provider_model: str
    seed: int | None = None


class AIProvider(Protocol):
    """Protocol for AI image generation providers."""

    async def generate(
        self,
        prompt: str,
        reference_image_bytes: bytes | None = None,
    ) -> GeneratedImageResult:
        """
        Generates an image from a prompt and an optional reference image.
        Must raise exceptions derived from ProviderError on failure.
        """
        ...
