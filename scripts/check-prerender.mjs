import { readFileSync } from "node:fs";

for (const f of [
  "dist/public/index.html",
  "dist/public/order/index.html",
  "dist/public/checkout/index.html",
  "dist/public/404.html",
]) {
  const h = readFileSync(f, "utf8");
  const titles = [...h.matchAll(/<title[^>]*>([^<]*)<\/title>/gi)].map((m) => m[1]);
  const cans = [...h.matchAll(/rel=["']canonical["'][^>]*href=["']([^"']+)["']/gi)].map(
    (m) => m[1]
  );
  const h1s = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    m[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
  const hasMenu = /Street Tacos|Taquitos|Burrito|Enchiladas/i.test(h);
  const hasLd = /application\/ld\+json/i.test(h);
  console.log(f);
  console.log("  titles:", titles);
  console.log("  canonicals:", cans);
  console.log("  h1s:", h1s);
  console.log("  menuHTML:", hasMenu, "jsonld:", hasLd);
}
