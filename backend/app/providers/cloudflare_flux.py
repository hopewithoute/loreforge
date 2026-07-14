import base64
import logging

import httpx

from app.core.config import settings
from app.core.errors import (
    ProviderBrokenResponseError,
    ProviderConfigError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.providers.base import AIProvider, GeneratedImageResult

logger = logging.getLogger(__name__)


class CloudflareFluxAdapter(AIProvider):
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
            files = {"input_image_0": ("reference.png", reference_image_bytes, "image/png")}

        logger.info(f"Dispatching to Cloudflare AI [{self.model}] with timeout {self.timeout}s.")
        # DO NOT log headers to prevent leaking tokens

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, data=data, files=files)

            if response.status_code in (401, 403):
                raise ProviderConfigError("Cloudflare API token is invalid or lacks permissions.")
            elif response.status_code == 429:
                raise ProviderRateLimitError("Cloudflare AI rate limit exceeded.")
            elif response.status_code >= 500:
                raise ProviderUnavailableError(f"Cloudflare returned {response.status_code} error.")

            response.raise_for_status()

            payload = response.json()

            if (
                not isinstance(payload, dict)
                or "result" not in payload
                or "image" not in payload["result"]
            ):
                raise ProviderBrokenResponseError("Cloudflare response missing 'result.image'.")

            base64_img = payload["result"]["image"]
            if not base64_img:
                raise ProviderBrokenResponseError("Cloudflare returned an empty image string.")

            try:
                image_bytes = base64.b64decode(base64_img)
            except Exception as e:
                raise ProviderBrokenResponseError("Failed to decode Base64 image payload.") from e

            return GeneratedImageResult(
                image_bytes=image_bytes,
                provider_name="cloudflare",
                provider_model=self.model,
            )

        except httpx.TimeoutException as e:
            raise ProviderTimeoutError("Cloudflare API timed out.") from e
        except httpx.RequestError as e:
            raise ProviderUnavailableError("Network error while calling Cloudflare API.") from e
