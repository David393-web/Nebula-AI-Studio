import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ADMIN_DASHBOARD_PATH,
  USER_DASHBOARD_PATH,
  canAccessAdminDashboard,
  resolveAuthenticatedDestination,
  resolveLoginDestination,
} from "./authRouting.js";

test("ADMIN login routes to the existing Admin Dashboard", () => {
  assert.equal(resolveLoginDestination({ role: "ADMIN" }), ADMIN_DASHBOARD_PATH);
  assert.equal(resolveLoginDestination({ role: "ADMIN" }, USER_DASHBOARD_PATH), ADMIN_DASHBOARD_PATH);
});

test("normal user login keeps the user dashboard and cannot return to the admin path", () => {
  assert.equal(resolveLoginDestination({ role: "USER" }), USER_DASHBOARD_PATH);
  assert.equal(resolveLoginDestination({ role: "USER" }, ADMIN_DASHBOARD_PATH), USER_DASHBOARD_PATH);
  assert.equal(resolveLoginDestination({ role: "USER" }, "/projects"), "/projects");
});

test("Admin sidebar item targets the existing Admin Dashboard route", () => {
  const sidebarSource = readFileSync(new URL("../components/layout/Sidebar/sidebar.data.js", import.meta.url), "utf8");
  assert.match(sidebarSource, /label: "Admin", path: ADMIN_DASHBOARD_PATH/);
});

test("direct route access allows ADMIN and denies normal users", () => {
  assert.equal(canAccessAdminDashboard({ role: "ADMIN" }), true);
  assert.equal(canAccessAdminDashboard({ role: "USER" }), false);
  assert.equal(canAccessAdminDashboard(null), false);
});

test("refresh restoration routes according to the hydrated role", () => {
  assert.equal(resolveAuthenticatedDestination({ role: "ADMIN" }), ADMIN_DASHBOARD_PATH);
  assert.equal(resolveAuthenticatedDestination({ role: "USER" }), USER_DASHBOARD_PATH);
});
