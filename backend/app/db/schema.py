import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.models.asset import AssetStatus


class Base(DeclarativeBase):
    pass


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, index=True)
    category: Mapped[str] = mapped_column(String)
    style: Mapped[str] = mapped_column(String)
    prompt: Mapped[str] = mapped_column(String)

    reference_image_path: Mapped[str | None] = mapped_column(String)
    prepared_input_path: Mapped[str | None] = mapped_column(String)
    generated_image_path: Mapped[str | None] = mapped_column(String)
    parent_id: Mapped[str | None] = mapped_column(String)

    status: Mapped[str] = mapped_column(String, default=AssetStatus.pending.value)
    error_code: Mapped[str | None] = mapped_column(String)
    error_message: Mapped[str | None] = mapped_column(String)

    provider_name: Mapped[str | None] = mapped_column(String)
    provider_model: Mapped[str | None] = mapped_column(String)
    seed: Mapped[int | None] = mapped_column()

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
