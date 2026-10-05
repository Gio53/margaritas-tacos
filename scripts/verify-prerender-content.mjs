import { readFileSync, existsSync } from "node:fs";

function stripTags(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function check(label, file) {
  if (!existsSync(file)) {
    console.log(`${label}: MISSING ${file}`);
    return;
  }
  const html = readFileSync(file, "utf8");
  const rootIdx = html.indexOf('<div id="root">');
  const rootInner =
    rootIdx >= 0 ? html.slice(rootIdx + '<div id="root">'.length, rootIdx + 5000) : "";
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    stripTags(m[1])
  );
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1];
  const samples = [
    "Mexican Street",
    "Taquitos",
    "Burrito",
    "Pastor",
    "Island Park",
    "Enchiladas",
    "Quesadilla",
    "Birria",
  ];
  const found = samples.filter((s) => html.includes(s));
  console.log(`=== ${label} ===`);
  console.log("bytes:", html.length);
  console.log("title:", title);
  console.log("h1:", h1s);
  console.log("root starts with content?:", rootInner.trim().length > 100);
  console.log("root preview:", stripTags(rootInner).slice(0, 220));
  console.log("menu keywords:", found.join(", ") || "(none)");
  console.log("json-ld:", /application\/ld\+json/i.test(html));
  console.log("");
}

check("HOME dist", "dist/public/index.html");
check("ORDER dist", "dist/public/order/index.html");

try {
  const homeRes = await fetch("http://localhost:4173/");
  const orderRes = await fetch("http://localhost:4173/order");
  const homeHtml = await homeRes.text();
  const orderHtml = await orderRes.text();
  console.log("=== LIVE / ===");
  console.log("status", homeRes.status, "bytes", homeHtml.length);
  console.log(
    "h1",
    [...homeHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1]))
  );
  console.log("has Street Tacos", homeHtml.includes("Street Tacos"));
  console.log("has Taquitos", homeHtml.includes("Taquitos"));
  console.log("");
  console.log("=== LIVE /order ===");
  console.log("status", orderRes.status, "bytes", orderHtml.length);
  console.log(
    "h1",
    [...orderHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1]))
  );
  console.log("has Pastor", orderHtml.includes("Pastor"));
  console.log("has Taquitos", orderHtml.includes("Taquitos"));
} catch (e) {
  console.log("LIVE preview not reachable:", e.message);
  console.log("(dist/ files above are still the deployable truth)");
}
