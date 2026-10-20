import test from "node:test";
import assert from "node:assert/strict";
import { createApiClient } from "./createApiClient.js";

test("browser API requests send cookies for cross-origin authentication", async () => {
  const api = createApiClient("https://nebula-ai-api.onrender.com/api");
  let dispatchedConfig;

  await api.get("/auth/me", {
    adapter: async (config) => {
      dispatchedConfig = config;
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    },
  });

  assert.equal(dispatchedConfig.baseURL, "https://nebula-ai-api.onrender.com/api");
  assert.equal(dispatchedConfig.withCredentials, true);
});
