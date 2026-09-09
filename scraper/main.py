import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from database import init_db, async_session, ProductDB, PriceHistoryDB, ScrapeLogDB


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="MarketInsight API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/products")
async def get_products(
    source: str | None = Query(None, description="Filter by source: walmart, amazon"),
    category: str | None = Query(None, description="Filter by category"),
    sort_by: str = Query("price", sort_by="price, rating, reviews_count, name"),
    order: str = Query("desc", description="asc or desc"),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    async with async_session() as session:
        query = select(ProductDB)

        if source:
            query = query.where(ProductDB.source == source)
        if category:
            query = query.where(ProductDB.category == category)
        if min_price is not None:
            query = query.where(ProductDB.price >= min_price)
        if max_price is not None:
            query = query.where(ProductDB.price <= max_price)

        sort_col = getattr(ProductDB, sort_by, ProductDB.price)
        if order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(sort_col)

        query = query.offset(offset).limit(limit)
        result = await session.execute(query)
        products = result.scalars().all()

        return [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "original_price": p.original_price,
                "discount_pct": p.discount_pct,
                "rating": p.rating,
                "reviews_count": p.reviews_count,
                "category": p.category,
                "source": p.source,
                "url": p.url,
                "image_url": p.image_url,
                "seller": p.seller,
                "availability": p.availability,
                "country": p.country,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            }
            for p in products
        ]


@app.get("/api/products/{product_id}/history")
async def get_price_history(product_id: int):
    async with async_session() as session:
        query = (
            select(PriceHistoryDB)
            .where(PriceHistoryDB.product_id == product_id)
            .order_by(PriceHistoryDB.scraped_at)
        )
        result = await session.execute(query)
        history = result.scalars().all()

        return [
            {"price": h.price, "date": h.scraped_at.isoformat()}
            for h in history
        ]


@app.get("/api/stats")
async def get_stats(source: str | None = Query(None)):
    async with async_session() as session:
        query = select(ProductDB)
        if source:
            query = query.where(ProductDB.source == source)

        result = await session.execute(query)
        products = result.scalars().all()

        if not products:
            return {
                "total_products": 0,
                "avg_price": 0,
                "min_price": 0,
                "max_price": 0,
                "avg_rating": 0,
                "sources": [],
                "categories": [],
                "price_ranges": [],
            }

        prices = [p.price for p in products if p.price]
        ratings = [p.rating for p in products if p.rating]

        source_counts = {}
        category_counts = {}
        for p in products:
            source_counts[p.source] = source_counts.get(p.source, 0) + 1
            category_counts[p.category] = category_counts.get(p.category, 0) + 1

        return {
            "total_products": len(products),
            "avg_price": round(sum(prices) / len(prices), 2) if prices else 0,
            "min_price": min(prices) if prices else 0,
            "max_price": max(prices) if prices else 0,
            "avg_rating": round(sum(ratings) / len(ratings), 2) if ratings else 0,
            "sources": [{"name": k, "count": v} for k, v in source_counts.items()],
            "categories": [{"name": k, "count": v} for k, v in category_counts.items()],
            "price_ranges": _price_ranges(prices),
        }


def _price_ranges(prices: list[float]) -> list[dict]:
    ranges = [
        {"label": "$0-$25", "min": 0, "max": 25},
        {"label": "$25-$50", "min": 25, "max": 50},
        {"label": "$50-$100", "min": 50, "max": 100},
        {"label": "$100-$250", "min": 100, "max": 250},
        {"label": "$250-$500", "min": 250, "max": 500},
        {"label": "$500+", "min": 500, "max": float("inf")},
    ]
    return [
        {"label": r["label"], "count": sum(1 for p in prices if r["min"] <= p < r["max"])}
        for r in ranges
    ]


@app.get("/api/categories")
async def get_categories():
    async with async_session() as session:
        result = await session.execute(
            select(ProductDB.category, func.count(ProductDB.id))
            .group_by(ProductDB.category)
            .order_by(desc(func.count(ProductDB.id)))
        )
        return [{"name": row[0], "count": row[1]} for row in result.all()]


@app.get("/api/sources")
async def get_sources():
    async with async_session() as session:
        result = await session.execute(
            select(ProductDB.source, func.count(ProductDB.id))
            .group_by(ProductDB.source)
        )
        return [{"name": row[0], "count": row[1]} for row in result.all()]


@app.get("/api/scrape-logs")
async def get_scrape_logs(limit: int = Query(10, ge=1, le=50)):
    async with async_session() as session:
        result = await session.execute(
            select(ScrapeLogDB).order_by(desc(ScrapeLogDB.started_at)).limit(limit)
        )
        logs = result.scalars().all()
        return [
            {
                "id": log.id,
                "source": log.source,
                "status": log.status,
                "products_found": log.products_found,
                "error": log.error,
                "started_at": log.started_at.isoformat() if log.started_at else None,
                "completed_at": log.completed_at.isoformat() if log.completed_at else None,
            }
            for log in logs
        ]


@app.get("/api/top-products")
async def get_top_products(
    source: str | None = Query(None),
    limit: int = Query(10, ge=1, le=50),
):
    async with async_session() as session:
        query = select(ProductDB).where(ProductDB.reviews_count.isnot(None))
        if source:
            query = query.where(ProductDB.source == source)
        query = query.order_by(desc(ProductDB.reviews_count)).limit(limit)

        result = await session.execute(query)
        products = result.scalars().all()

        return [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "rating": p.rating,
                "reviews_count": p.reviews_count,
                "source": p.source,
                "category": p.category,
                "url": p.url,
                "image_url": p.image_url,
            }
            for p in products
        ]


from pydantic import BaseModel
from scrapers import scrape_scrapegraph_ollama
from run_scraper import save_scrape_result


class AIScrapeRequest(BaseModel):
    url: str
    prompt: str | None = None
    model: str = "ollama/llama3.2"
    source: str = "ai-scrapegraph"


@app.post("/api/scrape/scrapegraph")
async def run_ai_scrape(req: AIScrapeRequest):
    result = await scrape_scrapegraph_ollama(
        target_url=req.url,
        prompt=req.prompt,
        model=req.model,
        source_name=req.source,
    )
    await save_scrape_result(result)
    return {
        "status": result.status,
        "source": result.source,
        "products_count": len(result.products),
        "products": [p.dict() for p in result.products],
        "error": result.error,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

