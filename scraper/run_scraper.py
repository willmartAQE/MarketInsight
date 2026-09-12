import asyncio
import sys
import os
from types import SimpleNamespace
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, async_session, ProductDB, PriceHistoryDB, ScrapeLogDB
from scrapers.scrapling_scrapers import (
    scrape_lego_scrapling,
    scrape_interflora_scrapling,
    scrape_amazon_jp_scrapling,
    scrape_sephora_scrapling,
    scrape_target_scrapling,
)


async def save_dict_scrape_result(res_dict):
    source = res_dict.get("source", "unknown")
    status = res_dict.get("status", "success")
    products = res_dict.get("products", [])

    async with async_session() as session:
        log = ScrapeLogDB(
            source=source,
            status=status,
            products_found=len(products),
            error=res_dict.get("error"),
            completed_at=datetime.utcnow(),
        )
        session.add(log)
        await session.commit()

        for p in products:
            url = p.get("url")
            if not url:
                continue

            existing = await session.execute(
                ProductDB.__table__.select().where(ProductDB.url == url)
            )
            row = existing.first()

            if row:
                product_id = row.id
                await session.execute(
                    ProductDB.__table__.update()
                    .where(ProductDB.id == product_id)
                    .values(
                        name=p.get("name"),
                        price=p.get("price"),
                        original_price=p.get("original_price"),
                        discount_pct=p.get("discount_pct"),
                        rating=p.get("rating"),
                        reviews_count=p.get("reviews_count"),
                        category=p.get("category", "General"),
                        image_url=p.get("image_url"),
                        seller=p.get("seller"),
                        availability=p.get("availability"),
                        country=p.get("country", "US"),
                        updated_at=datetime.utcnow(),
                    )
                )
            else:
                new_product = ProductDB(
                    name=p.get("name"),
                    price=p.get("price"),
                    original_price=p.get("original_price"),
                    discount_pct=p.get("discount_pct"),
                    rating=p.get("rating"),
                    reviews_count=p.get("reviews_count"),
                    category=p.get("category", "General"),
                    source=source,
                    url=url,
                    image_url=p.get("image_url"),
                    seller=p.get("seller"),
                    availability=p.get("availability"),
                    country=p.get("country", "US"),
                )
                session.add(new_product)
                await session.flush()
                product_id = new_product.id

            price_entry = PriceHistoryDB(
                product_id=product_id,
                price=p.get("price", 0.0),
                scraped_at=datetime.utcnow(),
            )
            session.add(price_entry)

        await session.commit()
        print(f"[{source}] Saved {len(products)} products (status: {status}) via Scrapling engine")


async def main():
    await init_db()
    print(f"Scrapling Scraping Engine started at {datetime.utcnow().isoformat()}")

    sources = sys.argv[1:] if len(sys.argv) > 1 else ["lego", "interflora", "target", "sephora", "amazon-jp"]

    if "lego" in sources:
        res = scrape_lego_scrapling()
        await save_dict_scrape_result(res)

    if "interflora" in sources:
        res = scrape_interflora_scrapling()
        await save_dict_scrape_result(res)

    if "target" in sources:
        res = scrape_target_scrapling()
        await save_dict_scrape_result(res)

    if "sephora" in sources:
        res = scrape_sephora_scrapling()
        await save_dict_scrape_result(res)

    if "amazon-jp" in sources:
        res = scrape_amazon_jp_scrapling()
        await save_dict_scrape_result(res)

    print(f"Scrapling Scraping Engine completed at {datetime.utcnow().isoformat()}")


if __name__ == "__main__":
    asyncio.run(main())
