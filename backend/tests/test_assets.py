import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_create_asset_invalid_prompt(client):
    response = client.post(
        "/api/assets/", data={"prompt": "ab", "category": "character", "style": "pixel_art"}
    )
    assert response.status_code == 422
    assert "Prompt must be at least 3 characters if provided" in response.text


def test_create_asset_invalid_category(client):
    response = client.post(
        "/api/assets/",
        data={"prompt": "a beautiful sword", "category": "invalid_category", "style": "pixel_art"},
    )
    assert response.status_code == 422
    assert "Input should be 'environment', 'character' or 'prop'" in response.text


def test_create_and_get_asset(client):
    response = client.post(
        "/api/assets/",
        data={"prompt": "a beautiful sword", "category": "prop", "style": "pixel_art"},
    )
    assert response.status_code == 202
    asset_id = response.json()["id"]

    # Verify session cookie was set
    assert "session_id" in response.cookies

    # Get asset using the same client (session_id cookie is sent automatically)
    response_get = client.get(f"/api/assets/{asset_id}")
    assert response_get.status_code == 200
    data = response_get.json()
    assert data["id"] == asset_id
    assert data["status"] == "pending"
    assert data["prompt"] == "a beautiful sword"


def test_get_asset_wrong_user(client):
    # create asset
    response = client.post(
        "/api/assets/",
        data={"prompt": "a beautiful sword", "category": "prop", "style": "pixel_art"},
    )
    asset_id = response.json()["id"]

    # Get asset without cookie (simulating different user getting a new cookie or no cookie)
    # The dependency will generate a NEW session_id for this request!
    client.cookies.clear()
    response2 = client.get(f"/api/assets/{asset_id}")
    assert response2.status_code == 404


def test_create_asset_with_invalid_file_type(client):
    response = client.post(
        "/api/assets/",
        data={"prompt": "a beautiful sword", "category": "prop", "style": "pixel_art"},
        files={"reference_image": ("test.pdf", b"fake_pdf_content", "application/pdf")},
    )
    assert response.status_code == 422
    assert "INVALID_FILE_TYPE" in response.json()["detail"]


def test_create_asset_with_large_file(client, monkeypatch):
    # Temporarily set max_upload_mb to 0.0001 (100 bytes) for this test
    monkeypatch.setattr(settings, "max_upload_mb", 0.0001)

    large_content = b"x" * 200  # 200 bytes

    response = client.post(
        "/api/assets/",
        data={"prompt": "a beautiful sword", "category": "prop", "style": "pixel_art"},
        files={"reference_image": ("test.png", large_content, "image/png")},
    )
    assert response.status_code == 413
    assert "UPLOAD_TOO_LARGE" in response.json()["detail"]


def test_evolve_asset_success(client):
    # First create an asset
    response = client.post(
        "/api/assets/",
        data={"prompt": "a base sword", "category": "prop", "style": "pixel_art"},
    )
    parent_id = response.json()["id"]

    # Now evolve it
    evolve_response = client.post(
        f"/api/assets/{parent_id}/evolve",
        json={"prompt": "an evolved sword", "category": "prop", "style": "pixel_art"}
    )
    
    assert evolve_response.status_code == 202
    evolve_data = evolve_response.json()
    assert evolve_data["id"] != parent_id
    assert evolve_data["parent_id"] == parent_id
    assert evolve_data["prompt"] == "an evolved sword"
    assert evolve_data["category"] == "prop"
    assert evolve_data["style"] == "pixel_art"


def test_evolve_asset_wrong_user(client):
    # Create an asset
    response = client.post(
        "/api/assets/",
        data={"prompt": "a base sword", "category": "prop", "style": "pixel_art"},
    )
    parent_id = response.json()["id"]

    # Clear cookie to simulate different user
    client.cookies.clear()

    # Try to evolve it
    evolve_response = client.post(
        f"/api/assets/{parent_id}/evolve",
        json={"prompt": "an evolved sword", "category": "prop", "style": "pixel_art"}
    )
    
    assert evolve_response.status_code == 404
    assert evolve_response.json()["detail"] == "Parent asset not found"
