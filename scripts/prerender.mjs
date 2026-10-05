/**
 * Post-build prerender: serve dist/public, crawl public routes with Puppeteer,
 * write static HTML so crawlers see meta, H1, and menu without executing JS.
 *
 * Usage: node scripts/prerender.mjs  (after vite build → dist/public)
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist", "public");
const PORT = 4179;

const ROUTES = ["/", "/order", "/checkout", "/404"];

const SITE = "https://margaritastacos.com";
const OG_IMAGE = `${SITE}/images/og-margaritas-tacos.jpg`;

const SEO_BY_ROUTE = {
  "/": {
    title: "Margaritas Tacos | Mexican Restaurant in Island Park, NY",
    description:
      "Authentic Mexican street food in Island Park, NY. Tacos, burritos, nachos, quesadillas & more. Dine-in, takeout & delivery. Call (516) 432-2119.",
    canonical: `${SITE}/`,
    ogType: "restaurant",
    robots: "index, follow",
  },
  "/order": {
    title: "Order Online | Margaritas Tacos Menu — Island Park, NY",
    description:
      "Order Mexican street tacos, burritos, taquitos, nachos, quesadillas & more online for pickup at Margaritas Tacos in Island Park, NY.",
    canonical: `${SITE}/order`,
    ogType: "website",
    robots: "index, follow",
  },
  "/checkout": {
    title: "Checkout | Margaritas Tacos — Island Park, NY",
    description:
      "Complete your Margaritas Tacos pickup order. Authentic Mexican street food in Island Park, NY.",
    canonical: `${SITE}/checkout`,
    ogType: "website",
    robots: "noindex, nofollow",
  },
  "/404": {
    title: "Page Not Found | Margaritas Tacos",
    description: "The page you requested was not found. Visit Margaritas Tacos in Island Park, NY.",
    canonical: `${SITE}/404`,
    ogType: "website",
    robots: "noindex, nofollow",
  },
};

/** Collapse Helmet + template duplicates into one clean head for crawlers. */
function normalizeHead(html, route) {
  const seo = SEO_BY_ROUTE[route];
  if (!seo) return html;

  let out = html;
  out = out.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "");
  out = out.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "");
  out = out.replace(/<meta\b[^>]*name=["']description["'][^>]*>/gi, "");
  out = out.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/gi, "");
  out = out.replace(/<meta\b[^>]*property=["']og:(?:title|description|url|type|image|image:alt|locale|site_name)["'][^>]*>/gi, "");
  out = out.replace(/<meta\b[^>]*name=["']twitter:(?:card|title|description|image)["'][^>]*>/gi, "");
  // Keep a single JSON-LD block
  const ldBlocks = [...out.matchAll(/<script type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi)];
  if (ldBlocks.length > 1) {
    for (let i = 0; i < ldBlocks.length - 1; i++) {
      out = out.replace(ldBlocks[i][0], "");
    }
  }

  const tags = [
    `<title>${seo.title}</title>`,
    `<meta name="description" content="${seo.description.replace(/"/g, "&quot;")}">`,
    `<link rel="canonical" href="${seo.canonical}">`,
    `<meta name="robots" content="${seo.robots}">`,
    `<meta property="og:title" content="${seo.title.replace(/"/g, "&quot;")}">`,
    `<meta property="og:description" content="${seo.description.replace(/"/g, "&quot;")}">`,
    `<meta property="og:url" content="${seo.canonical}">`,
    `<meta property="og:type" content="${seo.ogType}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    `<meta property="og:image:alt" content="Margaritas Tacos — Mexican street food in Island Park, NY">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:site_name" content="Margaritas Tacos">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${seo.title.replace(/"/g, "&quot;")}">`,
    `<meta name="twitter:description" content="${seo.description.replace(/"/g, "&quot;")}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
  ].join("\n    ");

  out = out.replace(/<head([^>]*)>/i, `<head$1>\n    ${tags}\n`);
  return out;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
      let filePath = path.join(DIST, urlPath === "/" ? "index.html" : urlPath);

      if (!filePath.startsWith(DIST)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        // SPA fallback for client assets during crawl
        filePath = path.join(DIST, "index.html");
      }

      try {
        const body = readFileSync(filePath);
        res.writeHead(200, { "Content-Type": contentType(filePath) });
        res.end(body);
      } catch {
        res.writeHead(500);
        res.end("Error");
      }
    });
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

function outPathForRoute(route) {
  if (route === "/") return path.join(DIST, "index.html");
  if (route === "/404") return path.join(DIST, "404.html");
  const dir = path.join(DIST, route.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  return path.join(dir, "index.html");
}

async function main() {
  if (!existsSync(path.join(DIST, "index.html"))) {
    console.error("dist/public/index.html missing — run vite build first");
    process.exit(1);
  }

  const server = await startStaticServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      const url = `http://127.0.0.1:${PORT}${route === "/404" ? "/404" : route}`;
      console.log(`Prerender ${route} → ${url}`);
      // Prefer load over networkidle — hours/API polling can keep the network busy
      await page.goto(url, { waitUntil: "load", timeout: 120_000 });
      await page.waitForSelector("#root h1", { timeout: 60_000 });
      // Extra beat for Helmet to flush meta into <head>
      await new Promise((r) => setTimeout(r, 800));
      const html = normalizeHead(await page.content(), route);
      const out = outPathForRoute(route);
      writeFileSync(out, html, "utf-8");
      console.log(`  wrote ${path.relative(ROOT, out)} (${html.length} bytes)`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  // Sanity: home must contain H1 and menu keyword
  const home = readFileSync(path.join(DIST, "index.html"), "utf-8");
  if (!/<h1[\s>]/i.test(home)) {
    console.error("Prerender check failed: no <h1> in index.html");
    process.exit(1);
  }
  if (!/application\/ld\+json/i.test(home)) {
    console.error("Prerender check failed: no JSON-LD in index.html");
    process.exit(1);
  }
  console.log("Prerender complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
