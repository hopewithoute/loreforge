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

        width, height = img.size
        longest_side = max(width, height)

        if longest_side > max_size:
            ratio = max_size / longest_side
            new_width = int(width * ratio)
            new_height = int(height * ratio)

            # Resize using high-quality downsampling
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        output = io.BytesIO()
        img.save(output, format="PNG")
        return output.getvalue()
