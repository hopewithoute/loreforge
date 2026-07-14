from typing import Protocol


class GeneratedImageResult:
    """Normalized payload returning from an AI provider."""

    def __init__(
        self, image_bytes: bytes, provider_name: str, provider_model: str, seed: int | None = None
    ):
        self.image_bytes = image_bytes
        self.provider_name = provider_name
        self.provider_model = provider_model
        self.seed = seed


class AIProvider(Protocol):
    """Protocol for AI image generation providers."""

    async def generate(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        reference_image_bytes: bytes | None = None,
    ) -> GeneratedImageResult:
        """
        Generates an image from a prompt and an optional reference image.
        Must raise exceptions derived from ProviderError on failure.
        """
        ...
