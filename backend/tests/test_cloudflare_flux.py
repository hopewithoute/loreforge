import base64
import io

import httpx
import pytest
from PIL import Image

from app.core.config import settings
from app.core.errors import (
    ProviderBrokenResponseError,
    ProviderConfigError,
    ProviderRateLimitError,
    ProviderUnavailableError,
)
from app.providers.cloudflare_flux import CloudflareFluxAdapter


# Override the conftest.py mock_cloudflare_adapter so we can test the real generate method
@pytest.fixture(autouse=True)
def mock_cloudflare_adapter():
    pass


def create_valid_png_base64() -> str:
    img = Image.new("RGB", (10, 10), color="red")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


@pytest.fixture
def adapter(monkeypatch):
    monkeypatch.setattr(settings, "cloudflare_account_id", "test_acc")
    monkeypatch.setattr(settings, "cloudflare_api_token", "test_tok")
    monkeypatch.setattr(settings, "cloudflare_model", "test_mod")
    return CloudflareFluxAdapter()


class MockTransport(httpx.AsyncBaseTransport):
    def __init__(self, handler):
        self.handler = handler

    async def handle_async_request(self, request):
        return self.handler(request)


_original_client = httpx.AsyncClient


@pytest.mark.anyio
async def test_generate_success(adapter, monkeypatch):
    b64 = create_valid_png_base64()

    def handler(req):
        return httpx.Response(200, json={"result": {"image": b64}}, request=req)

    def mock_client(*args, **kwargs):
        kwargs["transport"] = MockTransport(handler)
        return _original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mock_client)

    res = await adapter.generate("test prompt")
    assert res.provider_name == "cloudflare"
    assert res.image_bytes is not None


@pytest.mark.anyio
async def test_generate_invalid_json(adapter, monkeypatch):
    def handler(req):
        return httpx.Response(200, content=b"not json", request=req)

    def mock_client(*args, **kwargs):
        kwargs["transport"] = MockTransport(handler)
        return _original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mock_client)

    with pytest.raises(ProviderBrokenResponseError, match="not valid JSON"):
        await adapter.generate("test prompt")


@pytest.mark.anyio
async def test_generate_missing_image(adapter, monkeypatch):
    def handler(req):
        return httpx.Response(200, json={"result": {"wrong": "key"}}, request=req)

    def mock_client(*args, **kwargs):
        kwargs["transport"] = MockTransport(handler)
        return _original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mock_client)

    with pytest.raises(ProviderBrokenResponseError, match="failed schema validation"):
        await adapter.generate("test prompt")


@pytest.mark.anyio
async def test_generate_invalid_base64(adapter, monkeypatch):
    def handler(req):
        return httpx.Response(200, json={"result": {"image": "invalid base64 @#$"}}, request=req)

    def mock_client(*args, **kwargs):
        kwargs["transport"] = MockTransport(handler)
        return _original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mock_client)

    with pytest.raises(ProviderBrokenResponseError, match="Failed to decode Base64"):
        await adapter.generate("test prompt")


@pytest.mark.anyio
async def test_generate_not_an_image(adapter, monkeypatch):
    b64 = base64.b64encode(b"not an image bytes").decode("utf-8")

    def handler(req):
        return httpx.Response(200, json={"result": {"image": b64}}, request=req)

    def mock_client(*args, **kwargs):
        kwargs["transport"] = MockTransport(handler)
        return _original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mock_client)

    with pytest.raises(ProviderBrokenResponseError, match="not a valid image"):
        await adapter.generate("test prompt")


@pytest.mark.anyio
async def test_generate_http_errors(adapter, monkeypatch):
    status_codes = [
        (401, ProviderConfigError),
        (403, ProviderConfigError),
        (429, ProviderRateLimitError),
        (400, ProviderUnavailableError),
        (500, ProviderUnavailableError),
    ]

    for status, exc in status_codes:

        def handler(req, s=status):
            return httpx.Response(s, content=b"error", request=req)

        def mock_client(*args, **kwargs):
            kwargs["transport"] = MockTransport(handler)
            return _original_client(*args, **kwargs)

        monkeypatch.setattr(httpx, "AsyncClient", mock_client)

        with pytest.raises(exc):
            await adapter.generate("test prompt")
