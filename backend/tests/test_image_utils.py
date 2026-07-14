import io

from fastapi import UploadFile
from PIL import Image
from starlette.datastructures import Headers

from app.core.config import settings
from app.services.image_utils import prepare_provider_image, validate_and_read_image


def make_upload(image_format: str, declared_content_type: str) -> tuple[UploadFile, bytes]:
    image = Image.new("RGB", (32, 24), color="green")
    image_buffer = io.BytesIO()
    image.save(image_buffer, format=image_format)
    image_bytes = image_buffer.getvalue()

    upload = UploadFile(
        file=io.BytesIO(image_bytes),
        filename="reference.bin",
        headers=Headers({"content-type": declared_content_type}),
    )
    return upload, image_bytes


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


def test_validate_and_read_image_derives_png_extension_from_bytes():
    upload, image_bytes = make_upload("PNG", "application/octet-stream")

    result_bytes, extension = validate_and_read_image(upload)

    assert result_bytes == image_bytes
    assert extension == ".png"


def test_validate_and_read_image_derives_jpeg_extension_from_bytes():
    upload, image_bytes = make_upload("JPEG", "image/png")

    result_bytes, extension = validate_and_read_image(upload)

    assert result_bytes == image_bytes
    assert extension == ".jpg"
