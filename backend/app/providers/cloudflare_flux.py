import base64
import io
import logging
from typing import ClassVar

import httpx
from PIL import Image
from pydantic import BaseModel, ValidationError

from app.core.config import Settings, settings
from app.core.errors import (
    ProviderBrokenResponseError,
    ProviderConfigError,
    ProviderInvalidPromptError,
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
        reference_image_bytes: bytes | list[bytes] | None = None,
        seed: int | None = None,
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

        if seed is not None:
            data["seed"] = str(seed)

        files = None
        if reference_image_bytes:
            files = {}
            if isinstance(reference_image_bytes, bytes):
                reference_images = [reference_image_bytes]
            else:
                reference_images = reference_image_bytes

            # Cloudflare FLUX models support up to 4 images
            for i, img_bytes in enumerate(reference_images[:4]):
                files[f"input_image_{i}"] = (f"reference_{i}.png", img_bytes, "image/png")

        # DO NOT log headers to prevent leaking tokens
        logger.info(f"Dispatching to Cloudflare AI [{self.model}] with timeout {self.timeout}s.")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, data=data, files=files)

            # First, try to parse the Cloudflare standard JSON error format
            cf_error_code = None
            cf_error_message = None
            if response.status_code >= 400:
                try:
                    error_json = response.json()
                    errors = error_json.get("errors", [])
                    if errors and len(errors) > 0:
                        cf_error_code = errors[0].get("code")
                        cf_error_message = errors[0].get("message")
                except ValueError:
                    pass

            match response.status_code:
                case 200:
                    pass  # Handled below
                case 401 | 403:
                    msg = (
                        cf_error_message or "Cloudflare API token is invalid or lacks permissions."
                    )
                    raise ProviderConfigError(f"Cloudflare Config Error: {msg}")
                case 408:
                    msg = cf_error_message or "Cloudflare API request timeout."
                    raise ProviderTimeoutError(f"Cloudflare Timeout: {msg}")
                case 413:
                    msg = cf_error_message or "Cloudflare API request too large."
                    raise ProviderInvalidPromptError(f"Cloudflare Payload Too Large: {msg}")
                case 429:
                    msg = cf_error_message or "Cloudflare AI rate limit or capacity exceeded."
                    raise ProviderRateLimitError(
                        f"Cloudflare Rate Limit (Code {cf_error_code}): {msg}"
                    )
                case code if 400 <= code < 500:
                    msg = cf_error_message or f"Cloudflare returned {code} client error."
                    logger.error(f"Cloudflare {code} Client Error. Body: {response.text}")
                    # Assume 400s are prompt/input validation errors
                    raise ProviderInvalidPromptError(f"Cloudflare Error: {msg}")
                case code if code >= 500:
                    msg = cf_error_message or f"Cloudflare returned {code} server error."
                    raise ProviderUnavailableError(f"Cloudflare Server Error: {msg}")

            # Broken Response
            try:
                payload = response.json()
            except Exception as e:
                raise ProviderBrokenResponseError("Cloudflare response was not valid JSON.") from e
            # Broken Schema
            try:
                parsed = CloudflareResponse.model_validate(payload)
            except ValidationError as e:
                raise ProviderBrokenResponseError(
                    "Cloudflare response failed schema validation."
                ) from e

            # No Image Found
            if not parsed.result or not parsed.result.image:
                raise ProviderBrokenResponseError("Cloudflare response missing 'result.image'.")

            # Invalid Image
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

        # Network Error
        except httpx.TimeoutException as e:
            raise ProviderTimeoutError("Cloudflare API timed out.") from e
        except httpx.RequestError as e:
            raise ProviderUnavailableError("Network error while calling Cloudflare API.") from e
