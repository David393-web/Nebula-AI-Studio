import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Vercel serves the SPA entry point for client-side routes", () => {
  const config = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"));
  assert.deepEqual(config.rewrites, [{ source: "/(.*)", destination: "/index.html" }]);
});

test("the Vite production build emits the rewritten entry point", () => {
  const html = readFileSync(new URL("../../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /<div id="root"><\/div>/);
});
