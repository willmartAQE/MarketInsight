import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEPHORA_JS_CONFIG = {
  US: { source: "sephora", country: "US", currency: "$", domain: "sephora.com" },
  CA: { source: "sephora-ca", country: "CA", currency: "$", domain: "sephora.com" },
  FR: { source: "sephora-fr", country: "FR", currency: "€", domain: "sephora.fr" },
  IT: { source: "sephora-it", country: "IT", currency: "€", domain: "sephora.it" },
  DE: { source: "sephora-de", country: "DE", currency: "€", domain: "sephora.de" },
  ES: { source: "sephora-es", country: "ES", currency: "€", domain: "sephora.es" },
  UK: { source: "sephora-uk", country: "UK", currency: "£", domain: "sephora.co.uk" },
  PL: { source: "sephora-pl", country: "PL", currency: "zł", domain: "sephora.pl" },
};

export async function scrapeSephoraLocalized(countryCode = "US") {
  const code = (countryCode || "US").toUpperCase();
  const cfg = SEPHORA_JS_CONFIG[code] || SEPHORA_JS_CONFIG.US;
  const projectRoot = path.resolve(__dirname, "../../..");
  const pythonPath = path.resolve(projectRoot, "scraper/.venv/bin/python");

  return new Promise((resolve) => {
    const pythonCode = `
import json, sys
sys.path.append("${projectRoot}/scraper")
from scrapers.scrapling_scrapers import scrape_sephora_scrapling
res = scrape_sephora_scrapling("${code}")
print(json.dumps(res))
`;

    exec(`${pythonPath} -c '${pythonCode.replace(/'/g, "'\\''")}'`, (error, stdout) => {
      if (error || !stdout) {
        console.error(`[sephora-js] Failed dynamic scrape for ${code}: ${error?.message}`);
        return resolve({ source: cfg.source, products: [], status: "success" });
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve({
          source: cfg.source,
          products: parsed.products || [],
          status: "success"
        });
      } catch (err) {
        console.error(`[sephora-js] JSON parse error for ${code}: ${err.message}`);
        resolve({ source: cfg.source, products: [], status: "success" });
      }
    });
  });
}

export async function scrapeSephora() {
  return scrapeSephoraLocalized("US");
}
