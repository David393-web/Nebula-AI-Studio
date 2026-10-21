import test from "node:test";
import assert from "node:assert/strict";
import { resolveApiBaseUrl } from "./apiBaseUrl.js";

test("a development URL is passed through when configured", () => {
  assert.equal(
    resolveApiBaseUrl({ mode: "development", apiUrl: "http://localhost:5000/api" }),
    "http://localhost:5000/api",
  );
});

test("uses the configured API URL", () => {
  assert.equal(
    resolveApiBaseUrl({ mode: "production", apiUrl: "https://api.example.com/api/" }),
    "https://api.example.com/api",
  );
});

test("accepts the deployed Render API URL", () => {
  assert.equal(
    resolveApiBaseUrl({ mode: "production", apiUrl: "https://nebula-ai-api.onrender.com/api" }),
    "https://nebula-ai-api.onrender.com/api",
  );
});

test("production requires an API URL", () => {
  assert.throws(() => resolveApiBaseUrl({ mode: "production" }), /VITE_API_URL is required/);
});

test("production rejects localhost and non-HTTPS API URLs", () => {
  assert.throws(
    () => resolveApiBaseUrl({ mode: "production", apiUrl: "http://localhost:5000/api" }),
    /HTTPS and cannot point to localhost/,
  );
  assert.throws(
    () => resolveApiBaseUrl({ mode: "production", apiUrl: "http://api.example.com/api" }),
    /HTTPS and cannot point to localhost/,
  );
});

test("requires the API path", () => {
  assert.throws(
    () => resolveApiBaseUrl({ mode: "production", apiUrl: "https://api.example.com" }),
    /ending in \/api/,
  );
});
