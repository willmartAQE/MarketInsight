from datetime import datetime
from pydantic import BaseModel, Field


class Product(BaseModel):
    name: str
    price: float
    original_price: float | None = None
    discount_pct: float | None = None
    rating: float | None = None
    reviews_count: int | None = None
    category: str = "General"
    source: str  # "walmart" | "amazon"
    url: str
    image_url: str | None = None
    seller: str | None = None
    availability: str | None = None
    country: str = "USA"


class ScrapeResult(BaseModel):
    source: str
    products: list[Product]
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "success"
    error: str | None = None
