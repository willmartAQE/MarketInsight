import { gotScraping } from "got-scraping";

export async function testOdooConnection({ url, db, username, apiKey }) {
  if (!url || !db || !username || !apiKey) {
    return { success: false, error: "Missing required Odoo connection credentials" };
  }

  let cleanUrl = url.trim().replace(/\/+$/, "");
  if (!cleanUrl.startsWith("http")) cleanUrl = `https://${cleanUrl}`;

  try {
    const res = await gotScraping.post(`${cleanUrl}/jsonrpc`, {
      json: {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "common",
          method: "authenticate",
          args: [db.trim(), username.trim(), apiKey.trim(), {}],
        },
        id: Math.floor(Math.random() * 1000),
      },
      responseType: "json",
      timeout: { request: 10000 },
    });

    const data = res.body;
    if (data.error) {
      const msg = data.error.data?.message || data.error.message || "Odoo authentication failed";
      return { success: false, error: msg };
    }

    const uid = data.result;
    if (uid && typeof uid === "number") {
      return { success: true, uid, message: `Connected to Odoo successfully as User ID ${uid}` };
    }

    return { success: false, error: "Invalid credentials or database name" };
  } catch (err) {
    return { success: false, error: `Connection failed: ${err.message}` };
  }
}

export async function syncProductsToOdoo(products, config) {
  const authRes = await testOdooConnection(config);
  if (!authRes.success || !authRes.uid) {
    return { success: false, error: authRes.error || "Authentication failed" };
  }

  const { url, db, apiKey } = config;
  const uid = authRes.uid;
  let cleanUrl = url.trim().replace(/\/+$/, "");
  if (!cleanUrl.startsWith("http")) cleanUrl = `https://${cleanUrl}`;

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const prod of products) {
    try {
      const description = `Store: ${prod.source} | Country: ${prod.country || "US"}\nProduct Page: ${prod.url}\nRating: ${prod.rating || "N/A"} (${prod.reviews_count || 0} reviews)\nMarketInsight ID: ${prod.id}`;
      const defaultCode = `MI-${prod.source.toUpperCase()}-${prod.id}`;

      // Check if product already exists by default_code
      const searchRes = await gotScraping.post(`${cleanUrl}/jsonrpc`, {
        json: {
          jsonrpc: "2.0",
          method: "call",
          params: {
            service: "object",
            method: "execute_kw",
            args: [
              db.trim(),
              uid,
              apiKey.trim(),
              "product.template",
              "search_read",
              [[["default_code", "=", defaultCode]]],
              { fields: ["id", "name"], limit: 1 },
            ],
          },
          id: Math.floor(Math.random() * 1000),
        },
        responseType: "json",
      });

      const searchBody = searchRes.body;
      const existing = searchBody.result?.[0];

      let imageBase64 = null;
      if (prod.image_url) {
        try {
          const imgRes = await gotScraping.get(prod.image_url, { responseType: "buffer", timeout: { request: 5000 } });
          if (imgRes.body && imgRes.body.length > 0) {
            imageBase64 = imgRes.body.toString("base64");
          }
        } catch {}
      }

      const productPayload = {
        name: prod.name,
        list_price: parseFloat(prod.price) || 0,
        standard_price: parseFloat(prod.original_price) || parseFloat(prod.price) * 0.85,
        description_sale: description,
        default_code: defaultCode,
        website_url: prod.url,
      };

      if (imageBase64) {
        productPayload.image_1920 = imageBase64;
      }

      if (existing && existing.id) {
        // Update existing product in Odoo
        await gotScraping.post(`${cleanUrl}/jsonrpc`, {
          json: {
            jsonrpc: "2.0",
            method: "call",
            params: {
              service: "object",
              method: "execute_kw",
              args: [
                db.trim(),
                uid,
                apiKey.trim(),
                "product.template",
                "write",
                [[existing.id], productPayload],
              ],
            },
            id: Math.floor(Math.random() * 1000),
          },
          responseType: "json",
        });

        results.push({ id: prod.id, name: prod.name, odooId: existing.id, status: "updated" });
        successCount++;
      } else {
        // Create new product template in Odoo
        const createRes = await gotScraping.post(`${cleanUrl}/jsonrpc`, {
          json: {
            jsonrpc: "2.0",
            method: "call",
            params: {
              service: "object",
              method: "execute_kw",
              args: [
                db.trim(),
                uid,
                apiKey.trim(),
                "product.template",
                "create",
                [productPayload],
              ],
            },
            id: Math.floor(Math.random() * 1000),
          },
          responseType: "json",
        });

        const newOdooId = createRes.body?.result;
        results.push({ id: prod.id, name: prod.name, odooId: newOdooId, status: "created" });
        successCount++;
      }
    } catch (err) {
      results.push({ id: prod.id, name: prod.name, error: err.message, status: "failed" });
      failCount++;
    }
  }

  return {
    success: true,
    summary: { total: products.length, successCount, failCount },
    details: results,
  };
}
