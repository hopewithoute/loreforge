from app.core.errors import ProviderError
from app.providers.base import GeneratedImageExtension, GeneratedImageResult


class MockAIProvider:
    def __init__(self, mode: str = "default"):
        self.mode = mode

    async def generate(
        self,
        prompt: str,
        reference_image_bytes: bytes | list[bytes] | None = None,
        strength: float | None = None,
    ) -> GeneratedImageResult:
        if self.mode == "error":
            raise ProviderError("Mock error")
        return GeneratedImageResult(
            image_bytes=b"mocked_image_bytes",
            extension=GeneratedImageExtension.PNG,
            provider_name="mock",
            provider_model=self.mode,
            seed=42,
        )
