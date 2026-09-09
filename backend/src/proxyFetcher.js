import http from "https";

export async function fetchGeoNodeProxies(country = null) {
  let url = "https://proxylist.geonode.com/api/proxy-list?page=1&limit=200&sort_by=responseTime&sort_type=asc";
  if (country) url += `&country_code=${country}`;

  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const proxies = (json.data || []).filter((p) => p.protocols.includes("http") || p.protocols.includes("https"));
          resolve(proxies.map((p) => `http://${p.ip}:${p.port}`));
        } catch {
          resolve([]);
        }
      });
    }).on("error", () => resolve([]));
  });
}
