import base64
import io
import logging

import httpx
from PIL import Image
from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.core.constants import MimeType
from app.core.errors import (
    ProviderBrokenResponseError,
    ProviderConfigError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.providers.base import AIProvider, GeneratedImageResult

logger = logging.getLogger(__name__)


class CloudflareResult(BaseModel):
    image: str


class CloudflareResponse(BaseModel):
    result: CloudflareResult | None = None


class CloudflareFluxAdapter(AIProvider):
    SUPPORTED_FORMATS = ("PNG", "JPEG")

    def __init__(self):
        self.account_id = settings.cloudflare_account_id
        self.api_token = settings.cloudflare_api_token
        self.model = settings.cloudflare_model
        self.timeout = settings.ai_timeout_seconds

    async def generate(
        self,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
        reference_image_bytes: bytes | None = None,
    ) -> GeneratedImageResult:

        if (
            not self.account_id
            or not self.api_token
            or self.account_id == "replace_me"
            or self.api_token == "replace_me"
        ):
            raise ProviderConfigError("Cloudflare credentials are not configured properly.")

        url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/ai/run/{self.model}"
        headers = {"Authorization": f"Bearer {self.api_token}"}

        data = {
            "prompt": prompt,
            "width": str(width),
            "height": str(height),
        }

        files = None
        if reference_image_bytes:
            # Send the reference image as multipart file payload if present.
            # Note: image_bytes is guaranteed to be PNG here because
            # it was normalized by image_utils.prepare_provider_image.
            files = {"input_image_0": ("reference.png", reference_image_bytes, MimeType.PNG)}

        logger.info(f"Dispatching to Cloudflare AI [{self.model}] with timeout {self.timeout}s.")
        # DO NOT log headers to prevent leaking tokens

        # Safely wire debug controls
        if settings.force_ai_timeout:
            import asyncio

            logger.warning("Simulating AI Timeout due to FORCE_AI_TIMEOUT=true")
            await asyncio.sleep(self.timeout + 1)
            raise ProviderTimeoutError("Controlled timeout triggered by debug switch.")

        if settings.force_broken_provider_response:
            logger.warning("Simulating Broken Response due to FORCE_BROKEN_PROVIDER_RESPONSE=true")
            raise ProviderBrokenResponseError(
                "Controlled broken response triggered by debug switch."
            )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, data=data, files=files)

            match response.status_code:
                case 401 | 403:
                    raise ProviderConfigError(
                        "Cloudflare API token is invalid or lacks permissions."
                    )
                case 429:
                    raise ProviderRateLimitError("Cloudflare AI rate limit exceeded.")
                case code if 400 <= code < 500:
                    raise ProviderUnavailableError(f"Cloudflare returned {code} client error.")
                case code if code >= 500:
                    raise ProviderUnavailableError(f"Cloudflare returned {code} server error.")

            response.raise_for_status()

            try:
                payload = response.json()
            except Exception as e:
                raise ProviderBrokenResponseError("Cloudflare response was not valid JSON.") from e

            if not isinstance(payload, dict):
                raise ProviderBrokenResponseError("Cloudflare response was not a JSON object.")

            try:
                parsed = CloudflareResponse.model_validate(payload)
            except ValidationError as e:
                raise ProviderBrokenResponseError(
                    "Cloudflare response failed schema validation."
                ) from e

            if not parsed.result or not parsed.result.image:
                raise ProviderBrokenResponseError("Cloudflare response missing 'result.image'.")

            try:
                image_bytes = base64.b64decode(parsed.result.image, validate=True)
            except Exception as e:
                raise ProviderBrokenResponseError("Failed to decode Base64 image payload.") from e

            try:
                img = Image.open(io.BytesIO(image_bytes))
                img.verify()
                if img.format not in self.SUPPORTED_FORMATS:
                    raise ProviderBrokenResponseError(
                        f"Cloudflare returned unsupported format: {img.format}"
                    )
            except ProviderBrokenResponseError:
                raise
            except Exception as e:
                raise ProviderBrokenResponseError(
                    "Cloudflare returned bytes that are not a valid image."
                ) from e

            return GeneratedImageResult(
                image_bytes=image_bytes,
                provider_name="cloudflare",
                provider_model=self.model,
            )

        except httpx.TimeoutException as e:
            raise ProviderTimeoutError("Cloudflare API timed out.") from e
        except httpx.RequestError as e:
            raise ProviderUnavailableError("Network error while calling Cloudflare API.") from e
