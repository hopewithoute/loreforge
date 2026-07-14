import io

from fastapi import HTTPException, UploadFile
from PIL import Image

from app.core.config import settings


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
    # Prevent decompression bombs
    Image.MAX_IMAGE_PIXELS = 50_000_000

    max_bytes = settings.max_upload_mb * 1024 * 1024
    chunk_size = 1024 * 64
    bytes_read = 0
    buffer = bytearray()

    while True:
        chunk = file.file.read(chunk_size)
        if not chunk:
            break
        bytes_read += len(chunk)
        if bytes_read > max_bytes:
            raise HTTPException(status_code=413, detail="UPLOAD_TOO_LARGE")
        buffer.extend(chunk)

    image_bytes = bytes(buffer)
    try:
        # Use Pillow to verify it's structurally valid
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
        if img.format not in ("PNG", "JPEG"):
            raise HTTPException(status_code=422, detail="INVALID_FILE_TYPE")
        extension = ".png" if img.format == "PNG" else ".jpg"
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail="INVALID_FILE_TYPE") from e

    return image_bytes, extension
