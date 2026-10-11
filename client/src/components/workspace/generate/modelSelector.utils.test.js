import test from "node:test";
import assert from "node:assert/strict";
import { filterModels, getCapabilityBadges, groupModels, toggleProviderGroup } from "./modelSelector.utils.js";

const models = [
  { id: "flux", displayName: "FLUX.2 Pro", provider: "Replicate", providerId: "replicate", capabilities: ["References"], resolutions: [], duration: null },
  { id: "wan", displayName: "Wan 2.6 I2V Flash", provider: "Alibaba Cloud", providerId: "alibaba", capabilities: ["References", "Audio"], resolutions: ["720P", "1080P"], duration: { min: 2, max: 15 } },
];

test("search and filters return only matching models", () => {
  assert.deepEqual(filterModels(models, { query: "1080p" }).map((model) => model.id), ["wan"]);
  assert.deepEqual(filterModels(models, { provider: "replicate" }).map((model) => model.id), ["flux"]);
  assert.deepEqual(filterModels(models, { feature: "Audio" }).map((model) => model.id), ["wan"]);
  assert.deepEqual(filterModels(models, { query: "unmatched" }), []);
});

test("provider groups can expand and collapse independently", () => {
  assert.deepEqual(Object.keys(groupModels(models)), ["Replicate", "Alibaba Cloud"]);
  const expanded = { Replicate: true };
  assert.deepEqual(toggleProviderGroup(expanded, "Replicate"), { Replicate: false });
  assert.deepEqual(toggleProviderGroup(expanded, "Alibaba Cloud"), { Replicate: true, "Alibaba Cloud": true });
});

test("capability badges come from verified model metadata", () => {
  assert.deepEqual(getCapabilityBadges(models[1]), ["References", "Audio", "720P", "1080P", "2–15s"]);
  assert.deepEqual(getCapabilityBadges(models[0]), ["References"]);
});
