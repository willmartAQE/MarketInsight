import Database from "better-sqlite3";
import { scrapeSephoraLocalized } from "./src/scrapers/sephora.js";

async function populateDb() {
  const db = new Database("./marketinsight.db");
  
  // 1. Clear legacy Sephora products
  const delStmt = db.prepare("DELETE FROM products WHERE source LIKE '%sephora%'");
  const info = delStmt.run();
  console.log(`Deleted ${info.changes} legacy Sephora products from SQLite database.`);

  const insertStmt = db.prepare(`
    INSERT INTO products (
      name, price, original_price, discount_pct, rating, reviews_count,
      category, source, url, image_url, seller, availability, country, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
    )
  `);

  const countries = ["US", "CA", "IT", "FR", "ES", "DE", "UK", "PL"];
  let totalSaved = 0;

  for (const cc of countries) {
    console.log(`\n=== Scraping and Saving ${cc} ===`);
    try {
      const res = await scrapeSephoraLocalized(cc);
      if (res && res.products && res.products.length > 0) {
        let savedCount = 0;
        for (const p of res.products) {
          try {
            insertStmt.run(
              p.name, p.price, p.original_price, p.discount_pct, p.rating, p.reviews_count,
              p.category, p.source, p.url, p.image_url, p.seller, p.availability, p.country
            );
            savedCount++;
          } catch(e) {
            console.error(`Insert error: ${e.message}`);
          }
        }
        console.log(`Saved ${savedCount} products into DB for source ${res.source} (${cc})`);
        totalSaved += savedCount;
      } else {
        console.log(`0 products returned for ${cc}`);
      }
    } catch(err) {
      console.error(`Error populating ${cc}: ${err.message}`);
    }
  }

  console.log(`\nTOTAL Sephora products populated in SQLite DB: ${totalSaved}`);
}

populateDb().catch(console.error);
