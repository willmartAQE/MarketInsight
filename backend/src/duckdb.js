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
