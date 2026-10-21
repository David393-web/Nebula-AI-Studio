import assert from "node:assert/strict";
import test from "node:test";
import { resolveHydrationFailure } from "./authHydration.js";

test("an expired or missing session is treated as anonymous only for 401", () => {
  assert.deepEqual(resolveHydrationFailure({ response: { status: 401 } }), {
    user: null,
    status: "anonymous",
  });
});

test("network and server failures preserve the route for a session retry", () => {
  for (const error of [new Error("Network unavailable"), { response: { status: 503 } }]) {
    assert.deepEqual(resolveHydrationFailure(error), {
      user: null,
      status: "unavailable",
    });
  }
});
