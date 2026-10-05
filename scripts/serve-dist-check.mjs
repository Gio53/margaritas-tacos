import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist/public");
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

function strip(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const server = createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  let fp = path.join(DIST, p === "/" ? "index.html" : p);
  if (existsSync(fp) && statSync(fp).isDirectory()) fp = path.join(fp, "index.html");
  if (!existsSync(fp)) {
    if (p.startsWith("/admin") || p === "/test-order" || p === "/receipt-preview") {
      fp = path.join(DIST, "index.html");
    } else {
      res.statusCode = 404;
      fp = path.join(DIST, "404.html");
    }
  }
  res.setHeader("Content-Type", MIME[path.extname(fp)] || "application/octet-stream");
  res.end(readFileSync(fp));
});

server.listen(4174, "127.0.0.1", async () => {
  for (const u of [
    "http://127.0.0.1:4174/",
    "http://127.0.0.1:4174/order",
    "http://127.0.0.1:4174/robots.txt",
  ]) {
    const r = await fetch(u);
    const t = await r.text();
    const h1 = [...t.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => strip(m[1]));
    const title = (t.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1];
    console.log(u, "status", r.status, "bytes", t.length);
    console.log("  title:", title);
    console.log("  h1:", h1);
    console.log(
      "  keywords:",
      ["Street Tacos", "Pastor", "Taquitos", "Island Park"].filter((k) => t.includes(k)).join(", ")
    );
  }
  server.close();
});
