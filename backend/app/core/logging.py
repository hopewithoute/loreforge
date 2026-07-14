import logging
import sys

from app.core.config import settings


def setup_logging():
    """Configure basic application logging."""
    log_level = logging.DEBUG if settings.app_env == "development" else logging.INFO

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    # Silence chatty third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
