import { chromium } from "playwright-core";
import { writeFile } from "node:fs/promises";

const baseUrl = process.env.AUDIT_BASE_URL || "http://localhost:5000";
const routes = [
  "/", "/about", "/download", "/news", "/posts", "/events", "/videos",
  "/weapons", "/maps", "/mercenaries", "/modes", "/ranks", "/global-wiki",
  "/content-hub", "/pages", "/sellers", "/reviews", "/forum", "/tutorials",
  "/faq", "/support", "/contact", "/privacy", "/terms", "/search?q=ak-47",
  "/login", "/register", "/reset-password", "/chat", "/ai", "/admin/login",
];
const timeoutMs = 12000;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const results = [];

for (const route of routes) {
  const page = await context.newPage();
  const consoleErrors = [];
  const resourceFailures = [];
  const pageErrors = [];
  page.on("response", (response) => {
    if (response.status() >= 400) resourceFailures.push({ status: response.status(), url: response.url() });
  });
  page.on("console", (message) => {
    const text = message.text();
    const isDevelopmentHmrNoise =
      /WebSocket connection.*localhost.*ERR_CONNECTION_(REFUSED|CLOSED)/.test(text) ||
      /Failed to load resource: net::ERR_CONNECTION_(REFUSED|CLOSED)/.test(text);
    if (message.type() === "error" && !isDevelopmentHmrNoise) consoleErrors.push(text);
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const startedAt = Date.now();
  try {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.locator("#root").waitFor({ state: "attached", timeout: timeoutMs });
    await page.waitForTimeout(350);
    const rootText = await page.locator("#root").innerText().catch(() => "");
    const visibleTextLength = rootText.trim().length;
    results.push({
      route,
      status: response?.status() ?? null,
      durationMs: Date.now() - startedAt,
      visibleTextLength,
      blank: visibleTextLength === 0,
      consoleErrors,
      resourceFailures,
      pageErrors,
    });
  } catch (error) {
    results.push({
      route,
      status: null,
      durationMs: Date.now() - startedAt,
      visibleTextLength: 0,
      blank: true,
      consoleErrors,
      resourceFailures,
      pageErrors: [...pageErrors, error instanceof Error ? error.message : String(error)],
    });
  } finally {
    await page.close();
  }
}

await browser.close();
await writeFile("/tmp/crwiki-route-audit.json", JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), results }, null, 2));
const failed = results.filter((result) => result.blank || result.status !== 200 || result.pageErrors.length);
console.log(JSON.stringify({ total: results.length, failed: failed.length, failedRoutes: failed }, null, 2));
process.exitCode = failed.length ? 1 : 0;
