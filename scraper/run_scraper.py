import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, async_session, ProductDB, PriceHistoryDB, ScrapeLogDB
from scrapers import scrape_walmart, scrape_amazon, scrape_scrapegraph_ollama
from datetime import datetime


async def save_scrape_result(result):
    async with async_session() as session:
        log = ScrapeLogDB(
            source=result.source,
            status=result.status,
            products_found=len(result.products),
            error=result.error,
            completed_at=datetime.utcnow() if result.status != "running" else None,
        )
        session.add(log)
        await session.commit()

        for p in result.products:
            existing = await session.execute(
                ProductDB.__table__.select().where(ProductDB.url == p.url)
            )
            row = existing.first()

            if row:
                product_id = row.id
                await session.execute(
                    ProductDB.__table__.update()
                    .where(ProductDB.id == product_id)
                    .values(
                        name=p.name,
                        price=p.price,
                        original_price=p.original_price,
                        discount_pct=p.discount_pct,
                        rating=p.rating,
                        reviews_count=p.reviews_count,
                        category=p.category,
                        image_url=p.image_url,
                        seller=p.seller,
                        availability=p.availability,
                        updated_at=datetime.utcnow(),
                    )
                )
            else:
                new_product = ProductDB(
                    name=p.name,
                    price=p.price,
                    original_price=p.original_price,
                    discount_pct=p.discount_pct,
                    rating=p.rating,
                    reviews_count=p.reviews_count,
                    category=p.category,
                    source=p.source,
                    url=p.url,
                    image_url=p.image_url,
                    seller=p.seller,
                    availability=p.availability,
                    country=p.country,
                )
                session.add(new_product)
                await session.flush()
                product_id = new_product.id

            price_entry = PriceHistoryDB(
                product_id=product_id,
                price=p.price,
                scraped_at=datetime.utcnow(),
            )
            session.add(price_entry)

        await session.commit()
        print(f"[{result.source}] Saved {len(result.products)} products (status: {result.status})")


async def main():
    await init_db()
    print(f"Scraping started at {datetime.utcnow().isoformat()}")

    sources = sys.argv[1:] if len(sys.argv) > 1 else ["walmart", "amazon"]

    if "scrapegraph" in sources:
        target_url = sys.argv[2] if len(sys.argv) > 2 else "https://www.homedepot.com/b/Tools/N-5yc1vZc258"
        model_name = sys.argv[3] if len(sys.argv) > 3 else "ollama/llama3.2"
        print(f"Running ScrapeGraphAI with Ollama ({model_name}) on {target_url}...")
        result = await scrape_scrapegraph_ollama(target_url=target_url, model=model_name)
        await save_scrape_result(result)

    if "walmart" in sources:
        print("Scraping Walmart...")
        result = await scrape_walmart()
        await save_scrape_result(result)

    if "amazon" in sources:
        print("Scraping Amazon...")
        result = await scrape_amazon()
        await save_scrape_result(result)

    print(f"Scraping completed at {datetime.utcnow().isoformat()}")


if __name__ == "__main__":
    asyncio.run(main())

