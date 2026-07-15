import asyncio
from app.core.errors import ProviderBrokenResponseError, ProviderTimeoutError
from app.providers.base import AIProvider, GeneratedImageExtension, GeneratedImageResult

class MockAIProvider(AIProvider):
    def __init__(self, mode: str):
        self.mode = mode
        
    async def generate(self, prompt: str, reference_image_bytes: bytes | None = None) -> GeneratedImageResult:
        if self.mode == "timeout":
            await asyncio.sleep(0.1) # small delay for async realism
            raise ProviderTimeoutError("Simulated timeout error.")
            
        if self.mode == "broken":
            raise ProviderBrokenResponseError("Simulated broken response error.")
            
        # Default success mode
        # 1x1 valid PNG byte string
        fake_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xfc\xff\xff\xff\xff\xff\x7f\x00\t\xbe\x02\xfe\x93\x11\x14\x95\x00\x00\x00\x00IEND\xaeB`\x82'
        
        return GeneratedImageResult(
            image_bytes=fake_png,
            extension=GeneratedImageExtension.PNG,
            provider_name="mock",
            provider_model=self.mode,
            seed=42
        )
