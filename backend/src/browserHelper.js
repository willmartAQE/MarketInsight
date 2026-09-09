import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { existsSync } from "fs";

puppeteer.use(StealthPlugin());

export function getExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (existsSync(macChrome)) {
    return macChrome;
  }
  return undefined;
}

export async function safeLaunchBrowser(customArgs = []) {
  const proxy = process.env.PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    ...customArgs
  ];

  let auth = null;
  if (proxy) {
    try {
      const parsed = new URL(proxy);
      if (parsed.username || parsed.password) {
        auth = { username: decodeURIComponent(parsed.username), password: decodeURIComponent(parsed.password) };
        args.push(`--proxy-server=${parsed.protocol}//${parsed.host}`);
      } else {
        args.push(`--proxy-server=${proxy}`);
      }
    } catch {
      args.push(`--proxy-server=${proxy}`);
    }
  }

  const options = {
    headless: "new",
    args,
  };

  const execPath = getExecutablePath();
  if (execPath) {
    options.executablePath = execPath;
  }

  try {
    const browser = await puppeteer.launch(options);
    return { browser, auth };
  } catch (err) {
    console.warn(`[browserHelper] Launch failed with executablePath: ${err.message}. Retrying default...`);
    delete options.executablePath;
    try {
      const browser = await puppeteer.launch(options);
      return { browser, auth };
    } catch (err2) {
      console.error(`[browserHelper] Puppeteer launch failed completely: ${err2.message}`);
      return null;
    }
  }
}
