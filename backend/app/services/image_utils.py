import io

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

async def validate_and_read_image(file) -> bytes:
    """
    Safely reads an uploaded file in chunks up to a maximum size limit.
    Verifies the bytes form a valid PNG or JPEG image.
    """
    from fastapi import HTTPException
    
    max_bytes = settings.max_upload_mb * 1024 * 1024
    chunk_size = 1024 * 64
    bytes_read = 0
    buffer = bytearray()
    
    while True:
        chunk = await file.read(chunk_size)
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
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=422, detail="INVALID_FILE_TYPE")
        
    return image_bytes
