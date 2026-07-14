import io

from PIL import Image

from app.core.config import settings
from app.services.image_utils import prepare_provider_image


def test_prepare_provider_image_resizes_large_images():
    # Create a large dummy image (1000x1000)
    img = Image.new("RGB", (1000, 1000), color="red")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")

    # Process it
    result_bytes = prepare_provider_image(img_bytes.getvalue())

    # Verify dimensions
    result_img = Image.open(io.BytesIO(result_bytes))

    max_size = settings.max_provider_reference_size
    assert result_img.size == (max_size, max_size)
    assert result_img.format == "PNG"


def test_prepare_provider_image_keeps_small_images_same_size():
    # Create a small dummy image (300x200)
    img = Image.new("RGB", (300, 200), color="blue")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")

    # Process it
    result_bytes = prepare_provider_image(img_bytes.getvalue())

    # Verify dimensions remain the same
    result_img = Image.open(io.BytesIO(result_bytes))

    assert result_img.size == (300, 200)
    assert result_img.format == "PNG"
