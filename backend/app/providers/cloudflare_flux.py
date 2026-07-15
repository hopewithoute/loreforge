import asyncio
import base64
import io
import logging
from typing import ClassVar

import httpx
from PIL import Image
from pydantic import BaseModel, ValidationError

from app.core.config import Settings, settings
from app.core.constants import MimeType
from app.core.errors import (
    ProviderBrokenResponseError,
    ProviderConfigError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.providers.base import AIProvider, GeneratedImageExtension, GeneratedImageResult

logger = logging.getLogger(__name__)


class CloudflareResult(BaseModel):
    image: str


class CloudflareResponse(BaseModel):
    result: CloudflareResult | None = None


class CloudflareFluxAdapter(AIProvider):
    OUTPUT_EXTENSIONS: ClassVar[dict[str, GeneratedImageExtension]] = {
        "PNG": GeneratedImageExtension.PNG,
        "JPEG": GeneratedImageExtension.JPEG,
    }

    def __init__(self, config: Settings | None = None):
        runtime = config or settings
        self.account_id = runtime.cloudflare_account_id
        self.api_token = runtime.cloudflare_api_token
        self.model = runtime.cloudflare_model
        self.timeout = runtime.ai_timeout_seconds
        self.width = runtime.ai_image_width
        self.height = runtime.ai_image_height


    async def generate(
        self,
        prompt: str,
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
            "width": str(self.width),
            "height": str(self.height),
        }

        files = None
        if reference_image_bytes:
            # Send the reference image as multipart file payload if present.
            # Note: image_bytes is guaranteed to be PNG here because
            # it was normalized by image_utils.prepare_provider_image.
            files = {"input_image_0": ("reference.png", reference_image_bytes, MimeType.PNG)}

        logger.info(f"Dispatching to Cloudflare AI [{self.model}] with timeout {self.timeout}s.")
        # DO NOT log headers to prevent leaking tokens



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

            try:
                payload = response.json()
            except Exception as e:
                raise ProviderBrokenResponseError("Cloudflare response was not valid JSON.") from e

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
                with Image.open(io.BytesIO(image_bytes)) as img:
                    extension = self.OUTPUT_EXTENSIONS.get(img.format or "")
                    if extension is None:
                        raise ProviderBrokenResponseError(
                            f"Cloudflare returned unsupported format: {img.format}"
                        )
                    img.verify()
            except ProviderBrokenResponseError:
                raise
            except Exception as e:
                raise ProviderBrokenResponseError(
                    "Cloudflare returned bytes that are not a valid image."
                ) from e

            return GeneratedImageResult(
                image_bytes=image_bytes,
                extension=extension,
                provider_name="cloudflare",
                provider_model=self.model,
            )

        except httpx.TimeoutException as e:
            raise ProviderTimeoutError("Cloudflare API timed out.") from e
        except httpx.RequestError as e:
            raise ProviderUnavailableError("Network error while calling Cloudflare API.") from e
