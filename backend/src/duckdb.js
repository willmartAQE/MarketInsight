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

export async function getDuckDBCrossBorderArbitrage() {
  await initDuckDB();
  const sql = `
    WITH product_pairs AS (
      SELECT
        p1.id as source_id,
        p1.name as item_name,
        p1.category,
        p1.price as price_low,
        p1.country as country_low,
        p1.source as store_low,
        p1.url as url_low,
        p1.image_url as image_url,
        p2.id as target_id,
        p2.price as price_high,
        p2.country as country_high,
        p2.source as store_high,
        p2.url as url_high,
        ROUND(p2.price - p1.price, 2) as price_diff,
        ROUND(((p2.price - p1.price) / p2.price) * 100, 1) as spread_pct
      FROM sqlite_db.products p1
      JOIN sqlite_db.products p2
        ON p1.category = p2.category
       AND (p1.country != p2.country OR p1.source != p2.source)
       AND p1.price < p2.price * 0.85
    )
    SELECT DISTINCT ON (item_name)
      source_id, item_name, category, price_low, country_low, store_low, url_low, image_url,
      price_high, country_high, store_high, url_high, price_diff, spread_pct
    FROM product_pairs
    ORDER BY item_name, spread_pct DESC
    LIMIT 12;
  `;
  return queryDuckDB(sql);
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

