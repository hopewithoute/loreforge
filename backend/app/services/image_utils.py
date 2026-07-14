import io

from fastapi import HTTPException, UploadFile
from PIL import Image

from app.core.config import settings
from app.core.constants import ErrorCode

Image.MAX_IMAGE_PIXELS = 50_000_000


def prepare_provider_image(image_bytes: bytes) -> bytes:
    """
    Resizes the image if its longest side exceeds max_provider_reference_size.
    Maintains aspect ratio. Returns the image as PNG bytes.
    """
    max_size = settings.max_provider_reference_size

    with Image.open(io.BytesIO(image_bytes)) as img:
        # Ensure we're in a format that saves well to PNG (or RGB for generic handling)
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")

        # thumbnail automatically preserves aspect ratio and only scales down!
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

        output = io.BytesIO()
        img.save(output, format="PNG")
        return output.getvalue()


def validate_and_read_image(file: UploadFile) -> tuple[bytes, str]:
    """
    Safely reads an uploaded file in chunks up to a maximum size limit.
    Verifies the bytes form a valid PNG or JPEG image and returns the bytes and extension.
    """
    max_bytes = settings.max_upload_mb * 1024 * 1024
    chunk_size = 1024 * 64
    buffer = bytearray()

    while True:
        chunk = file.file.read(chunk_size)
        if not chunk:
            break
        if len(buffer) + len(chunk) > max_bytes:
            raise HTTPException(status_code=413, detail=ErrorCode.UPLOAD_TOO_LARGE)
        buffer.extend(chunk)

    image_bytes = bytes(buffer)
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img.verify()
            image_format = img.format
    except Exception as e:
        raise HTTPException(status_code=422, detail=ErrorCode.INVALID_FILE_TYPE) from e

    if image_format not in ("PNG", "JPEG"):
        raise HTTPException(status_code=422, detail=ErrorCode.INVALID_FILE_TYPE)

    extension = ".png" if image_format == "PNG" else ".jpg"

    return image_bytes, extension
