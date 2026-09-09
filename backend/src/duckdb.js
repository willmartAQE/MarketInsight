import duckdb from "duckdb";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "marketinsight.db");

let dbInstance = null;
let initialized = false;

export function getDuckDB() {
  if (!dbInstance) {
    dbInstance = new duckdb.Database(":memory:");
  }
  return dbInstance;
}

export function execDuckDB(sql) {
  return new Promise((resolve, reject) => {
    const db = getDuckDB();
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function convertBigInts(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (typeof obj === "object") {
    const res = {};
    for (const key of Object.keys(obj)) {
      res[key] = convertBigInts(obj[key]);
    }
    return res;
  }
  return obj;
}

export function queryDuckDB(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDuckDB();
    db.all(sql, ...params, (err, rows) => {
      if (err) return reject(err);
      resolve(convertBigInts(rows));
    });
  });
}

export async function initDuckDB() {
  if (initialized) return;
  try {
    await execDuckDB(`INSTALL sqlite; LOAD sqlite;`);
    await execDuckDB(`ATTACH '${DB_PATH}' AS sqlite_db (TYPE SQLITE);`);
    initialized = true;
    console.log("🦆 DuckDB attached SQLite database successfully:", DB_PATH);
  } catch (err) {
    console.warn("⚠️ DuckDB init warning (will attempt query directly):", err.message);
  }
}

// OLAP Analytics Functions

export async function getDuckDBMarketplaceHeatmap() {
  await initDuckDB();
  const sql = `
    SELECT
      category,
      source,
      COUNT(*) as count,
      ROUND(AVG(price), 2) as avg_price,
      ROUND(MIN(price), 2) as min_price,
      ROUND(MAX(price), 2) as max_price
    FROM sqlite_db.products
    GROUP BY category, source
    ORDER BY category, avg_price ASC
  `;
  return queryDuckDB(sql);
}

export async function getDuckDBOutlierDeals() {
  await initDuckDB();
  const sql = `
    WITH stats AS (
      SELECT
        id, name, price, original_price, discount_pct, rating, reviews_count, source, category, country, url, image_url,
        AVG(price) OVER (PARTITION BY category) as cat_avg_price,
        STDDEV(price) OVER (PARTITION BY category) as cat_std_price
      FROM sqlite_db.products
    )
    SELECT
      id, name, price, original_price, discount_pct, rating, reviews_count, source, category, country, url, image_url,
      ROUND(cat_avg_price, 2) as category_avg,
      ROUND(((cat_avg_price - price) / cat_avg_price) * 100, 1) as savings_vs_avg_pct
    FROM stats
    WHERE price < (cat_avg_price - 0.2 * COALESCE(cat_std_price, 5))
    ORDER BY savings_vs_avg_pct DESC
    LIMIT 15;
  `;
  return queryDuckDB(sql);
}

export async function getDuckDBCategoryQuantiles() {
  await initDuckDB();
  const sql = `
    SELECT
      category,
      COUNT(*) as total_count,
      ROUND(AVG(price), 2) as avg_price,
      ROUND(QUANTILE_CONT(price, 0.25), 2) as p25_price,
      ROUND(QUANTILE_CONT(price, 0.50), 2) as median_price,
      ROUND(QUANTILE_CONT(price, 0.75), 2) as p75_price
    FROM sqlite_db.products
    GROUP BY category
    ORDER BY total_count DESC
  `;
  return queryDuckDB(sql);
}

export async function getDuckDBPriceClusters() {
  await initDuckDB();
  const sql = `
    WITH quantiles AS (
      SELECT
        category,
        QUANTILE_CONT(price, 0.33) as q1_3,
        QUANTILE_CONT(price, 0.66) as q2_3
      FROM sqlite_db.products
      GROUP BY category
    )
    SELECT
      p.id,
      p.name,
      p.price,
      p.original_price,
      p.rating,
      p.reviews_count,
      p.source,
      p.category,
      p.country,
      p.url,
      p.image_url,
      CASE
        WHEN p.price <= q.q1_3 THEN 'Budget Bargain'
        WHEN p.price <= q.q2_3 THEN 'Sweet-Spot Value'
        ELSE 'Premium Tier'
      END as cluster_tier,
      ROUND(q.q1_3, 2) as tier_low_max,
      ROUND(q.q2_3, 2) as tier_mid_max
    FROM sqlite_db.products p
    JOIN quantiles q ON p.category = q.category
    ORDER BY p.category, p.price ASC
  `;
  return queryDuckDB(sql);
}

const STOP_WORDS = new Set([
  'and', 'the', 'for', 'with', 'pack', 'of', 'in', 'to', 'a', 'set', 'by', 'on', 'is', 'or', 'at', 'from', 'an', 'are', 'pcs', 'count', 'black', 'white', 'blue', 'red', 'green', '1', '2', '3', '4', '5', '6', '8', '10', '12', 'oz', 'lb', 'mm', 'cm', 'inch', 'new'
]);

function getTokens(str) {
  if (!str) return new Set();
  const words = str.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/);
  return new Set(words.filter(w => w.length > 2 && !STOP_WORDS.has(w)));
}

function computeTokenSimilarity(title1, title2) {
  const t1 = getTokens(title1);
  const t2 = getTokens(title2);
  if (t1.size === 0 || t2.size === 0) return 0;
  
  let intersection = 0;
  for (const token of t1) {
    if (t2.has(token)) intersection++;
  }
  
  const union = t1.size + t2.size - intersection;
  return intersection / union;
}

export async function getDuckDBCrossBorderArbitrage() {
  await initDuckDB();
  const products = await queryDuckDB(`
    SELECT id, name, price, source, country, category, url, image_url
    FROM sqlite_db.products
    WHERE price > 0
  `);

  const candidates = [];
  const seenPairs = new Set();

  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const p1 = products[i];
      const p2 = products[j];

      // Must be from different store or country
      if (p1.country === p2.country && p1.source === p2.source) continue;

      // Identify low vs high price product
      const low = p1.price <= p2.price ? p1 : p2;
      const high = p1.price <= p2.price ? p2 : p1;

      // Guardrail 1: Price spread must be at least 15% and price ratio <= 3.2x
      const ratio = high.price / Math.max(low.price, 0.01);
      if (ratio < 1.15 || ratio > 3.2) continue;

      // Guardrail 2: Token similarity check (must share significant product title keywords)
      const sim = computeTokenSimilarity(low.name, high.name);
      if (sim < 0.30) continue;

      const pairKey = `${low.id}-${high.id}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const spreadPct = Math.round(((high.price - low.price) / high.price) * 100);
      const priceDiff = Math.round((high.price - low.price) * 100) / 100;

      candidates.push({
        source_id: low.id,
        item_name: low.name,
        category: low.category,
        price_low: low.price,
        country_low: low.country,
        store_low: low.source,
        url_low: low.url,
        image_url: low.image_url,
        price_high: high.price,
        country_high: high.country,
        store_high: high.source,
        url_high: high.url,
        price_diff: priceDiff,
        spread_pct: spreadPct,
        similarity: Math.round(sim * 100) / 100
      });
    }
  }

  // Sort candidates by highest price spread percentage
  candidates.sort((a, b) => b.spread_pct - a.spread_pct);

  // Deduplicate by item_name prefix to avoid listing minor variants of the same product repeatedly
  const uniqueItems = [];
  const seenItemKeys = new Set();

  for (const cand of candidates) {
    const normKey = cand.item_name.toLowerCase().slice(0, 30);
    if (!seenItemKeys.has(normKey)) {
      seenItemKeys.add(normKey);
      uniqueItems.push(cand);
    }
    if (uniqueItems.length >= 12) break;
  }

  return uniqueItems;
}

export async function getDuckDBMarketAttractiveness() {
  await initDuckDB();
  const sql = `
    WITH cat_stats AS (
      SELECT
        category,
        QUANTILE_CONT(price, 0.5) as median_price
      FROM sqlite_db.products
      GROUP BY category
    )
    SELECT
      p.id,
      p.name,
      p.price,
      p.original_price,
      p.discount_pct,
      p.rating,
      p.reviews_count,
      p.source,
      p.category,
      p.country,
      p.url,
      p.image_url,
      ROUND(
        GREATEST(0, LEAST(100,
          (COALESCE(p.rating, 4.0) / 5.0 * 30.0) +
          (LOG10(GREATEST(COALESCE(p.reviews_count, 10), 1) + 1) / 4.0 * 30.0) +
          (LEAST(COALESCE(p.discount_pct, 0), 60) / 60.0 * 20.0) +
          (GREATEST(0, (c.median_price - p.price) / c.median_price) * 20.0)
        )), 1
      ) as attractiveness_score
    FROM sqlite_db.products p
    JOIN cat_stats c ON p.category = c.category
    ORDER BY attractiveness_score DESC
    LIMIT 15;
  `;
  return queryDuckDB(sql);
}

