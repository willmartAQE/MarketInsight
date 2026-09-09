import httpx
import json
import re
from datetime import datetime
from models import Product, ScrapeResult

WALMART_SEARCH_URLS = [
    "https://www.walmart.com/search?q=best+sellers&sort=best_seller",
    "https://www.walmart.com/search?q=electronics+best+sellers&sort=best_seller",
    "https://www.walmart.com/search?q=home+best+sellers&sort=best_seller",
    "https://www.walmart.com/search?q=kitchen+best+sellers&sort=best_seller",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}


def _extract_products_from_html(html: str) -> list[Product]:
    match = re.search(
        r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
    )
    if not match:
        return []

    data = json.loads(match.group(1))
    try:
        search_result = data["props"]["pageProps"]["initialData"]["searchResult"]
        stacks = search_result.get("itemStacks", [])
    except (KeyError, TypeError):
        return []

    products = []
    for stack in stacks:
        items = stack.get("items", [])
        for item in items:
            if item.get("__typename") != "Product":
                continue
            try:
                price = float(item.get("price", 0))
                if price <= 0:
                    continue
            except (ValueError, TypeError):
                continue

            price_info = item.get("priceInfo", {})
            line_price = price_info.get("linePriceDisplay", "")
            original_price = None
            if line_price and line_price != f"${price:.2f}":
                try:
                    original_price = float(line_price.replace("$", "").replace(",", ""))
                except (ValueError, TypeError):
                    original_price = None

            rating_data = item.get("rating", {})
            avg_rating = item.get("averageRating") or (
                rating_data.get("averageRating") if isinstance(rating_data, dict) else None
            )
            reviews = item.get("numberOfReviews") or (
                rating_data.get("numberOfReviews") if isinstance(rating_data, dict) else None
            )

            availability = item.get("availabilityStatusV2", {})
            avail_text = availability.get("display", "Unknown") if isinstance(availability, dict) else "Unknown"

            category = item.get("departmentName", "General")

            url = item.get("canonicalUrl", "")
            if url and not url.startswith("http"):
                url = f"https://www.walmart.com{url}"

            products.append(Product(
                name=str(item.get("name", "Unknown")),
                price=price,
                original_price=original_price,
                discount_pct=None,
                rating=float(avg_rating) if avg_rating else None,
                reviews_count=int(reviews) if reviews else None,
                category=str(category),
                source="walmart",
                url=url,
                image_url=item.get("image"),
                seller=item.get("sellerName"),
                availability=avail_text,
                country="USA",
            ))

    return products


async def scrape_walmart() -> ScrapeResult:
    all_products = []
    seen_urls = set()

    async with httpx.AsyncClient(follow_redirects=True, timeout=20) as client:
        for url in WALMART_SEARCH_URLS:
            try:
                resp = await client.get(url, headers=HEADERS)
                if resp.status_code == 200:
                    products = _extract_products_from_html(resp.text)
                    for p in products:
                        if p.url not in seen_urls:
                            seen_urls.add(p.url)
                            all_products.append(p)
            except Exception as e:
                print(f"[walmart] Error fetching {url}: {e}")

    return ScrapeResult(
        source="walmart",
        products=all_products,
        scraped_at=datetime.utcnow(),
        status="success" if all_products else "error",
        error=None if all_products else "No products extracted",
    )
