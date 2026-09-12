import ssl
ssl._create_default_https_context = ssl._create_unverified_context

import undetected_chromedriver as uc
import time
import json
import re

def test_bestseller_dom():
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")

    driver = uc.Chrome(options=options, version_main=150)
    all_products = []
    seen_urls = set()

    try:
        print("1. Initializing Akamai session on sephora.it ...")
        driver.get("https://www.sephora.it")
        time.sleep(4)

        page_urls = [
            "https://www.sephora.it/bestseller/",
            "https://www.sephora.it/bestseller/?start=24&sz=24",
            "https://www.sephora.it/bestseller/?start=48&sz=24",
            "https://www.sephora.it/bestseller/?start=72&sz=24",
            "https://www.sephora.it/bestseller/?start=96&sz=24"
        ]

        badges = ["OFFERTA FEDELTÀ", "HOT ON SOCIAL", "ESCLUSIVO", "CLEAN AT SEPHORA", "NOVITÀ", "OFFERTA"]

        for p_idx, p_url in enumerate(page_urls):
            print(f"Fetching Page {p_idx + 1}: {p_url} ...")
            driver.get(p_url)
            time.sleep(4)

            driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 2);")
            time.sleep(1)
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1.5)

            items = driver.execute_script("""
                const products = [];
                const anchors = Array.from(document.querySelectorAll("a[href*='/p/']"));

                for (const a of anchors) {
                    const href = a.getAttribute("href");
                    if (!href) continue;
                    const fullUrl = href.startsWith("http") ? href : "https://www.sephora.it" + href;

                    const card = a.closest(".product-tile, [data-product-id], .card, [class*='product']") || a.parentElement.parentElement;
                    if (!card) continue;

                    const cardText = card.innerText || "";
                    const rawLines = cardText.split("\\n").map(l => l.trim()).filter(Boolean);

                    // Filter out non-title lines
                    const BADGES = ["OFFERTA FEDELTÀ", "HOT ON SOCIAL", "ESCLUSIVO", "CLEAN AT SEPHORA", "NOVITÀ", "OFFERTA FEDELTA"];
                    
                    const lines = rawLines.filter(l => !BADGES.includes(l.toUpperCase()));

                    let brand = "";
                    let titleLines = [];

                    for (const line of lines) {
                        if (line.includes("€") || line.includes("Recensioni") || line.includes("Aggiungi") || line.includes("Disponibile") || line.includes("Prezzo più basso") || line.startsWith("-")) {
                            break;
                        }
                        if (!brand && line === line.toUpperCase() && line.length >= 2 && !/\\d/.test(line)) {
                            brand = line;
                        } else {
                            titleLines.push(line);
                        }
                    }

                    if (!brand && titleLines.length > 0) {
                        brand = titleLines[0];
                        titleLines = titleLines.slice(1);
                    }

                    let rawTitle = titleLines.join(" ").trim();
                    if (!rawTitle && brand) rawTitle = brand;

                    let fullName = rawTitle;
                    if (brand && !fullName.toLowerCase().includes(brand.toLowerCase())) {
                        fullName = brand + " " + rawTitle;
                    }

                    // Prices
                    let price = 0;
                    let lowestPrice = 0;
                    let discountPct = 0;

                    const priceM = cardText.match(/(?:Da\\s*)?([\\d\\.,]+)\\s*€/i);
                    if (priceM) {
                        price = parseFloat(priceM[1].replace(",", "."));
                    }

                    const lowestM = cardText.match(/Prezzo più basso\\s*:\\s*([\\d\\.,]+)\\s*€/i);
                    if (lowestM) {
                        lowestPrice = parseFloat(lowestM[1].replace(",", "."));
                    }

                    const discountM = cardText.match(/-(\\d+)%/);
                    if (discountM) {
                        discountPct = parseInt(discountM[1], 10);
                    }

                    const reviewsM = cardText.match(/(\\d+)\\s*Recensioni/i);
                    const reviewsCount = reviewsM ? parseInt(reviewsM[1], 10) : 0;

                    const img = card.querySelector("img");
                    let imgUrl = "";
                    if (img) {
                        imgUrl = img.src || img.getAttribute("data-src") || img.getAttribute("srcset")?.split(" ")[0] || "";
                    }

                    if (price > 0 && fullName) {
                        if (lowestPrice === 0) lowestPrice = price;
                        if (discountPct === 0 && lowestPrice > price) {
                            discountPct = Math.round(((lowestPrice - price) / lowestPrice) * 100);
                        }

                        products.push({
                            brand,
                            name: fullName,
                            price,
                            original_price: lowestPrice,
                            discount_pct: discountPct,
                            rating: 4.6,
                            reviews_count: reviewsCount,
                            url: fullUrl,
                            image_url: imgUrl,
                            category: "Beauty",
                            seller: "Sephora Italia",
                            source: "sephora-it",
                            country: "IT",
                            currency: "€",
                            availability: "In Stock"
                        });
                    }
                }

                return products;
            """)

            for item in items:
                if item["url"] not in seen_urls:
                    seen_urls.add(item["url"])
                    all_products.append(item)
            print(f"Page {p_idx + 1} added {len(items)} items. Total unique so far: {len(all_products)}")

        print(f"\nCompleted extraction! Total unique products: {len(all_products)}")
        return all_products

    finally:
        driver.quit()

if __name__ == "__main__":
    prods = test_bestseller_dom()
    print(json.dumps(prods, indent=2, ensure_ascii=False))
