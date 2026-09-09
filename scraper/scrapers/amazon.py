import httpx
import re
from datetime import datetime
from bs4 import BeautifulSoup
from models import Product, ScrapeResult

AMAZON_URLS = [
    "https://www.amazon.com/Best-Sellers/zgbs",
    "https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics",
    "https://www.amazon.com/Best-Sellers-Home-Garden/zgbs/home-garden",
    "https://www.amazon.com/Best-Sellers-Kitchen/zgbs/kitchen",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

CATEGORY_MAP = {
    "Best-Sellers": "General",
    "Best-Sellers-Electronics": "Electronics",
    "Best-Sellers-Home-Garden": "Home & Garden",
    "Best-Sellers-Kitchen": "Kitchen",
}


def _extract_price(item) -> float | None:
    price_el = (
        item.select_one("span._cDEzb_p13n-sc-price_3mJ9Z")
        or item.select_one("span.a-price span.a-offscreen")
    )
    if price_el:
        text = price_el.text.strip()
        match = re.search(r"([\d,]+\.?\d*)", text)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except ValueError:
                pass

    all_text = item.get_text()
    price_match = re.search(r"\$([\d,]+\.?\d*)", all_text)
    if price_match:
        try:
            return float(price_match.group(1).replace(",", ""))
        except ValueError:
            pass

    return None


def _extract_products_from_html(html: str, source_url: str) -> list[Product]:
    soup = BeautifulSoup(html, "html.parser")
    products = []

    category = "General"
    for key, cat in CATEGORY_MAP.items():
        if key in source_url:
            category = cat
            break

    items = soup.select("[data-asin]")

    for item in items:
        asin = item.get("data-asin", "").strip()
        if not asin or len(asin) < 5:
            continue

        name_el = (
            item.select_one("a.a-link-normal span div")
            or item.select_one("div._cDEzb_p13n-sc-css-line-clamp-3_g3dy1")
            or item.select_one("span.zg-text-center-align")
        )
        if not name_el:
            continue
        name = name_el.text.strip()
        if not name:
            continue

        price = _extract_price(item)
        if price is None or price <= 0:
            continue

        rating = None
        rating_el = item.select_one("span.a-icon-alt")
        if rating_el:
            match = re.search(r"([\d.]+)\s+out", rating_el.text)
            if match:
                rating = float(match.group(1))

        reviews = None
        reviews_el = item.select_one("span.a-size-small")
        if reviews_el:
            reviews_text = reviews_el.text.strip().replace(",", "")
            try:
                reviews = int(reviews_text)
            except (ValueError, TypeError):
                pass

        url = f"https://www.amazon.com/dp/{asin}"

        image_el = item.select_one("img")
        image_url = image_el.get("src", None) if image_el else None

        products.append(Product(
            name=name,
            price=price,
            original_price=None,
            discount_pct=None,
            rating=rating,
            reviews_count=reviews,
            category=category,
            source="amazon",
            url=url,
            image_url=image_url,
            seller="Amazon.com",
            availability="In Stock",
            country="USA",
        ))

    return products


async def scrape_amazon() -> ScrapeResult:
    all_products = []
    seen_asins = set()

    async with httpx.AsyncClient(follow_redirects=True, timeout=20) as client:
        for url in AMAZON_URLS:
            try:
                resp = await client.get(url, headers=HEADERS)
                if resp.status_code == 200:
                    products = _extract_products_from_html(resp.text, url)
                    for p in products:
                        asin = p.url.split("/dp/")[-1] if "/dp/" in p.url else p.url
                        if asin not in seen_asins:
                            seen_asins.add(asin)
                            all_products.append(p)
            except Exception as e:
                print(f"[amazon] Error fetching {url}: {e}")

    return ScrapeResult(
        source="amazon",
        products=all_products,
        scraped_at=datetime.utcnow(),
        status="success" if all_products else "error",
        error=None if all_products else "No products extracted",
    )
