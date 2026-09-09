import os
import json
import asyncio
from datetime import datetime
from scrapegraphai.graphs import SmartScraperGraph
from models import Product, ScrapeResult

DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "ollama/llama3.2")
DEFAULT_OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

DEFAULT_PROMPT = """
Extract a list of products displayed on this page.
For each product, return a JSON object with:
- name: string (full title of the product)
- price: float (current sale price as a number, e.g. 29.99)
- original_price: float or null (original price if discounted)
- discount_pct: float or null (discount percentage if any)
- rating: float or null (customer rating out of 5)
- reviews_count: integer or null (total number of reviews)
- category: string (product category or General)
- source: string (marketplace name, e.g. amazon, walmart, ebay, homedepot, etc.)
- url: string (direct URL to the product detail page)
- image_url: string (direct URL of the product image)
- seller: string or null
- availability: string (e.g. "In Stock")
- country: string (e.g. "USA", "Germany", "Italy")
"""


def _normalize_product_dict(p: dict, fallback_source: str, fallback_url: str) -> dict:
    name = str(p.get("name") or p.get("product_name") or p.get("title") or "Unknown Product").strip()
    price = p.get("price")
    try:
        if isinstance(price, str):
            import re
            m = re.search(r"[\d\.]+", price.replace(",", ""))
            price = float(m.group(0)) if m else 0.0
        else:
            price = float(price) if price is not None else 0.0
    except (ValueError, TypeError):
        price = 0.0

    orig_price = p.get("original_price")
    try:
        orig_price = float(orig_price) if orig_price is not None else None
    except (ValueError, TypeError):
        orig_price = None

    rating = p.get("rating")
    try:
        rating = float(rating) if rating is not None else None
    except (ValueError, TypeError):
        rating = None

    reviews = p.get("reviews_count")
    try:
        reviews = int(reviews) if reviews is not None else None
    except (ValueError, TypeError):
        reviews = None

    url = str(p.get("url") or fallback_url).strip()
    if not url.startswith("http"):
        url = fallback_url

    return {
        "name": name,
        "price": price,
        "original_price": orig_price,
        "discount_pct": p.get("discount_pct"),
        "rating": rating,
        "reviews_count": reviews,
        "category": str(p.get("category") or "General").strip(),
        "source": str(p.get("source") or fallback_source).strip(),
        "url": url,
        "image_url": p.get("image_url"),
        "seller": p.get("seller") or "Marketplace Seller",
        "availability": str(p.get("availability") or "In Stock"),
        "country": str(p.get("country") or "USA"),
    }


async def scrape_scrapegraph_ollama(
    target_url: str,
    prompt: str = None,
    model: str = DEFAULT_OLLAMA_MODEL,
    base_url: str = DEFAULT_OLLAMA_URL,
    source_name: str = "ai-scrapegraph",
) -> ScrapeResult:
    """
    Scrapes a web page using ScrapeGraphAI powered by a local Ollama model.
    """
    if not model.startswith("ollama/"):
        model = f"ollama/{model}"

    extraction_prompt = prompt or DEFAULT_PROMPT

    graph_config = {
        "llm": {
            "model": model,
            "base_url": base_url,
            "temperature": 0,
        },
        "verbose": True,
        "headless": True,
    }

    # Fetch HTML content if target_url is a URL
    source_data = target_url
    if target_url.startswith("http://") or target_url.startswith("https://"):
        try:
            import requests
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            }
            resp = requests.get(target_url, headers=headers, timeout=20)
            if resp.status_code == 200 and resp.text:
                source_data = resp.text
                print(f"[scrapegraph-ollama] Successfully fetched {len(source_data)} chars from {target_url}")
        except Exception as fetch_err:
            print(f"[scrapegraph-ollama] Direct fetch warning: {fetch_err}. Passing raw URL to scraper.")

    try:
        print(f"[scrapegraph-ollama] Launching SmartScraperGraph on {target_url} with model {model}...")
        smart_scraper = SmartScraperGraph(
            prompt=extraction_prompt,
            source=source_data,
            config=graph_config,
        )

        raw_result = await asyncio.to_thread(smart_scraper.run)
        print(f"[scrapegraph-ollama] Raw extraction result: {raw_result}")

        products_list = []
        if isinstance(raw_result, dict):
            if "products" in raw_result and isinstance(raw_result["products"], list):
                products_list = raw_result["products"]
            elif "content" in raw_result:
                content = raw_result["content"]
                if isinstance(content, list):
                    products_list = content
                elif isinstance(content, dict):
                    if "products" in content and isinstance(content["products"], list):
                        products_list = content["products"]
                    else:
                        products_list = [content]
            elif "result" in raw_result and isinstance(raw_result["result"], list):
                products_list = raw_result["result"]
            else:
                for val in raw_result.values():
                    if isinstance(val, list):
                        products_list = val
                        break
                if not products_list:
                    products_list = [raw_result]
        elif isinstance(raw_result, list):
            products_list = raw_result

        cleaned_products = []
        for raw_p in products_list:
            if isinstance(raw_p, dict):
                norm = _normalize_product_dict(raw_p, source_name, target_url)
                if norm["name"] and norm["price"] > 0:
                    cleaned_products.append(Product(**norm))

        return ScrapeResult(
            source=source_name,
            products=cleaned_products,
            scraped_at=datetime.utcnow(),
            status="success",
        )
    except Exception as err:
        print(f"[scrapegraph-ollama] Error running SmartScraperGraph: {err}")
        return ScrapeResult(
            source=source_name,
            products=[],
            scraped_at=datetime.utcnow(),
            status="error",
            error=str(err),
        )


