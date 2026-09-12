import ssl
ssl._create_default_https_context = ssl._create_unverified_context

import undetected_chromedriver as uc
import time
import json

SEPHORA_CONFIG = {
    "IT": {"domain": "www.sephora.it", "country": "IT", "currency": "€", "source": "sephora-it", "seller": "Sephora Italia", "bestseller_path": "/bestseller/"},
    "FR": {"domain": "www.sephora.fr", "country": "FR", "currency": "€", "source": "sephora-fr", "seller": "Sephora France", "bestseller_path": "/best-seller/"},
    "ES": {"domain": "www.sephora.es", "country": "ES", "currency": "€", "source": "sephora-es", "seller": "Sephora España", "bestseller_path": "/best-sellers/"},
    "DE": {"domain": "www.sephora.de", "country": "DE", "currency": "€", "source": "sephora-de", "seller": "Sephora Germany", "bestseller_path": "/bestseller/"},
    "UK": {"domain": "www.sephora.co.uk", "country": "UK", "currency": "£", "source": "sephora-uk", "seller": "Sephora UK", "bestseller_path": "/bestsellers"},
    "PL": {"domain": "www.sephora.pl", "country": "PL", "currency": "zł", "source": "sephora-pl", "seller": "Sephora Polska", "bestseller_path": "/bestseller/"},
    "US": {"domain": "www.sephora.com", "country": "US", "currency": "$", "source": "sephora", "seller": "Sephora US", "bestseller_path": "/shop/bestselling-beauty-products"},
    "CA": {"domain": "www.sephora.com", "country": "CA", "currency": "$", "source": "sephora-ca", "seller": "Sephora Canada", "bestseller_path": "/shop/bestselling-beauty-products?country_switch=ca&lang=en"},
}

def test_country(country_code, driver):
    cc = country_code.upper()
    cfg = SEPHORA_CONFIG[cc]
    domain_str = cfg["domain"]
    source_id = cfg["source"]
    seller_name = cfg["seller"]
    currency_str = cfg["currency"]
    base_path = cfg["bestseller_path"]

    print(f"\n==========================================")
    print(f"Testing Sephora {cc} ({seller_name}) Bestseller Extraction...")
    print(f"==========================================")

    all_products = []
    seen_urls = set()

    try:
        root_url = f"https://{domain_str}"
        print(f"1. Initializing Akamai session on {root_url}...")
        driver.get(root_url)
        time.sleep(4)

        if "?" in base_path:
            page_urls = [f"https://{domain_str}{base_path}&start={i*24}&sz=24" for i in range(5)]
        else:
            page_urls = [
                f"https://{domain_str}{base_path}",
                f"https://{domain_str}{base_path}?start=24&sz=24",
                f"https://{domain_str}{base_path}?start=48&sz=24",
                f"https://{domain_str}{base_path}?start=72&sz=24",
                f"https://{domain_str}{base_path}?start=96&sz=24"
            ]

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
                const anchors = Array.from(document.querySelectorAll("a[href*='/p/'], a[href*='/product/']"));

                for (const a of anchors) {
                    const href = a.getAttribute("href");
                    if (!href) continue;
                    const fullUrl = href.startsWith("http") ? href : "https://" + window.location.host + href;

                    const card = a.closest(".product-tile, [data-product-id], .card, [class*='product']") || a.parentElement.parentElement;
                    if (!card) continue;

                    const cardText = card.innerText || "";
                    const rawLines = cardText.split("\\n").map(l => l.trim()).filter(Boolean);

                    const BADGES = ["OFFERTA FEDELTÀ", "HOT ON SOCIAL", "ESCLUSIVO", "CLEAN AT SEPHORA", "NOVITÀ", "OFFERTA FEDELTA", "BESTSELLER", "MEILLEURES VENTES", "MAS VENDIDOS"];
                    const lines = rawLines.filter(l => !BADGES.includes(l.toUpperCase()));

                    let brand = "";
                    let titleLines = [];

                    for (const line of lines) {
                        if (line.includes("€") || line.includes("£") || line.includes("zł") || line.includes("$") || line.includes("Recensioni") || line.includes("Aggiungi") || line.includes("Disponibile") || line.includes("Prezzo più basso") || line.startsWith("-")) {
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
                    if (rawTitle.endsWith(" Da")) rawTitle = rawTitle.slice(0, -3).trim();

                    let fullName = rawTitle;
                    if (brand && !fullName.toLowerCase().includes(brand.toLowerCase())) {
                        fullName = brand + " " + rawTitle;
                    }

                    let price = 0;
                    let lowestPrice = 0;
                    let discountPct = 0;

                    const priceM = cardText.match(/(?:Da\\s*|From\\s*|Dès\\s*)?([\\d\\.,]+)\\s*[€£zł$]|[$€£zł]\\s*([\\d\\.,]+)/i);
                    if (priceM) {
                        const rawP = (priceM[1] || priceM[2]).replace(",", ".");
                        price = parseFloat(rawP);
                    }

                    const lowestM = cardText.match(/(?:Prezzo più basso|Lowest price|Prix le plus bas)\\s*:\\s*([\\d\\.,]+)\\s*[€£zł$]|[$€£zł]\\s*([\\d\\.,]+)/i);
                    if (lowestM) {
                        const rawL = (lowestM[1] || lowestM[2]).replace(",", ".");
                        lowestPrice = parseFloat(rawL);
                    }

                    const discountM = cardText.match(/-(\\d+)%/);
                    if (discountM) {
                        discountPct = parseInt(discountM[1], 10);
                    }

                    const reviewsM = cardText.match(/(\\d+)\\s*(?:Recensioni|reviews|avis|reseñas|opinie)/i);
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
                            image_url: imgUrl
                        });
                    }
                }

                return products;
            """)

            for item in items:
                if item["url"] not in seen_urls:
                    seen_urls.add(item["url"])
                    all_products.append(item)

        print(f"[{cc}] Extraction complete! Total unique products: {len(all_products)}")
        if len(all_products) > 0:
            print(f"Sample product #1 for {cc}:", json.dumps(all_products[0], indent=2, ensure_ascii=False))

        return all_products

    except Exception as e:
        print(f"[{cc}] Error during extraction: {e}")
        return []

def main():
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")

    driver = uc.Chrome(options=options, version_main=150)
    results = {}

    try:
        for country in ["FR", "ES", "DE", "UK", "PL", "US", "CA"]:
            prods = test_country(country, driver)
            results[country] = len(prods)
    finally:
        driver.quit()

    print("\n================ SUMMARY ================")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
