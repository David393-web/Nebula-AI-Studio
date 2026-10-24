import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const publicUrl = (path) => new URL(`../public/${path}`, import.meta.url);

test("PWA manifest has installable Nebula branding and root scope", () => {
  const manifest = JSON.parse(readFileSync(publicUrl("manifest.webmanifest"), "utf8"));
  assert.equal(manifest.name, "Nebula AI Studio");
  assert.equal(manifest.short_name, "Nebula AI");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));

  for (const size of [192, 512]) {
    const icon = manifest.icons.find((entry) => entry.sizes === `${size}x${size}`);
    assert.ok(icon, `manifest declares a ${size}x${size} icon`);
    const png = readFileSync(publicUrl(icon.src.slice(1)));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  assert.equal(readFileSync(publicUrl("icons/apple-touch-icon.png")).readUInt32BE(16), 180);
});

test("service worker avoids API and media requests and refreshes navigations", () => {
  const serviceWorker = readFileSync(publicUrl("sw.js"), "utf8");
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/media\/"\)/);
  assert.match(serviceWorker, /fetch\(request, \{ cache: "no-store" \}\)/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/assets\/"\)/);
});

test("frontend links the manifest and registers the root-scoped service worker", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const entry = readFileSync(new URL("./main.jsx", import.meta.url), "utf8");
  const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /apple-touch-icon\.png/);
  assert.match(entry, /register\("\/sw\.js", \{ scope: "\/", updateViaCache: "none" \}\)/);
  assert.equal(vercel.headers.find((item) => item.source === "/manifest.webmanifest")?.headers[0].value,
    "application/manifest+json; charset=utf-8");
  assert.equal(vercel.headers.find((item) => item.source === "/sw.js")?.headers[0].value,
    "application/javascript; charset=utf-8");
});
