import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_create_asset_invalid_prompt(client):
    response = client.post(
        "/api/assets/", json={"prompt": "ab", "category": "character", "style": "pixel_art"}
    )
    assert response.status_code == 422
    assert "String should have at least 3 characters" in response.text


def test_create_asset_invalid_category(client):
    response = client.post(
        "/api/assets/",
        json={"prompt": "a beautiful sword", "category": "invalid_category", "style": "pixel_art"},
    )
    assert response.status_code == 422
    assert "Input should be 'environment', 'character' or 'prop'" in response.text


def test_create_and_get_asset(client):
    response = client.post(
        "/api/assets/",
        json={"prompt": "a beautiful sword", "category": "prop", "style": "pixel_art"},
    )
    assert response.status_code == 202
    data = response.json()
    assert data["prompt"] == "a beautiful sword"
    assert data["status"] == "pending"
    asset_id = data["id"]

    # Client should have received session_id cookie
    cookies = response.cookies
    assert "session_id" in cookies

    # Get the asset using the same cookie
    response2 = client.get(f"/api/assets/{asset_id}", cookies=cookies)
    assert response2.status_code == 200
    assert response2.json()["id"] == asset_id


def test_get_asset_wrong_user(client):
    # create asset
    response = client.post(
        "/api/assets/",
        json={"prompt": "a beautiful sword", "category": "prop", "style": "pixel_art"},
    )
    asset_id = response.json()["id"]

    # Get asset without cookie (simulating different user getting a new cookie or no cookie)
    # The dependency will generate a NEW session_id for this request!
    client.cookies.clear()
    response2 = client.get(f"/api/assets/{asset_id}")
    assert response2.status_code == 404
