import Database from "better-sqlite3";
import { scrapeSephoraLocalized } from "./src/scrapers/sephora.js";

async function populateIT() {
  const db = new Database("./marketinsight.db");

  // Delete previous Sephora IT products to replace with clean live Bestseller extraction
  console.log("Cleaning up old sephora-it products...");
  db.prepare("DELETE FROM products WHERE source = 'sephora-it' OR seller = 'Sephora Italia'").run();

  const insertStmt = db.prepare(`
    INSERT INTO products (
      name, price, original_price, discount_pct, rating, reviews_count,
      category, source, url, image_url, seller, availability, country, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
    )
  `);

  console.log("Scraping Sephora IT Bestsellers...");
  const res = await scrapeSephoraLocalized("IT");
  if (res && res.products) {
    let count = 0;
    for (const p of res.products) {
      try {
        insertStmt.run(
          p.name, p.price, p.original_price, p.discount_pct, p.rating, p.reviews_count,
          p.category, p.source, p.url, p.image_url, p.seller, p.availability, p.country
        );
        count++;
      } catch(e) {
        console.error("Insert error:", e.message);
      }
    }
    console.log(`Saved ${count} Sephora IT Bestseller products into database!`);
  }
}

populateIT().catch(console.error);
