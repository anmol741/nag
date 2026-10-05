import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedOrigin, isNetlifyDeployOriginOf, isSameOriginRequest, parseOriginList, type OriginContext } from "../lib/security/origin";

const SITE = "https://taupe-buttercream-c55e75.netlify.app";

const prod: OriginContext = {
  configuredOrigins: [SITE],
  requestOrigin: SITE, // what Netlify reports even on branch URLs (the live 403 cause)
  allowLocalhost: false,
  allowNetlifyDeploySubdomains: true,
};

test("accepts the configured production origin", () => {
  assert.equal(isAllowedOrigin(SITE, prod), true);
});

test("accepts Netlify branch/deploy URLs of the same site (fixes the live 403)", () => {
  assert.equal(isAllowedOrigin("https://main--taupe-buttercream-c55e75.netlify.app", prod), true);
  assert.equal(isAllowedOrigin("https://68f0c1a2b3c4d5e6f7a8b9c0--taupe-buttercream-c55e75.netlify.app", prod), true);
  assert.equal(isAllowedOrigin("https://deploy-preview-12--taupe-buttercream-c55e75.netlify.app", prod), true);
});

test("rejects other Netlify sites and look-alike hosts", () => {
  assert.equal(isAllowedOrigin("https://main--evil-site.netlify.app", prod), false);
  assert.equal(isAllowedOrigin("https://evil.netlify.app", prod), false);
  assert.equal(isAllowedOrigin("https://main--taupe-buttercream-c55e75.netlify.app.evil.com", prod), false);
  assert.equal(isAllowedOrigin("https://x.main--taupe-buttercream-c55e75.netlify.app", prod), false);
  assert.equal(isAllowedOrigin("http://main--taupe-buttercream-c55e75.netlify.app", prod), false);
});

test("deploy subdomains can be switched off", () => {
  assert.equal(isAllowedOrigin("https://main--taupe-buttercream-c55e75.netlify.app", { ...prod, allowNetlifyDeploySubdomains: false }), false);
});

test("rejects arbitrary, malformed and null origins", () => {
  assert.equal(isAllowedOrigin("https://evil.com", prod), false);
  assert.equal(isAllowedOrigin("null", prod), false);
  assert.equal(isAllowedOrigin(null, prod), false);
  assert.equal(isAllowedOrigin("javascript:alert(1)", prod), false);
  assert.equal(isAllowedOrigin(`${SITE}.evil.com`, prod), false);
});

test("localhost only outside production", () => {
  assert.equal(isAllowedOrigin("http://localhost:3000", prod), false);
  assert.equal(isAllowedOrigin("http://localhost:3000", { ...prod, allowLocalhost: true }), true);
});

test("Sec-Fetch-Site: cross-site is always rejected", () => {
  assert.equal(isSameOriginRequest({ origin: SITE, referer: null, secFetchSite: "cross-site" }, prod), false);
  assert.equal(isSameOriginRequest({ origin: SITE, referer: null, secFetchSite: "same-origin" }, prod), true);
});

test("falls back to Referer when Origin is absent", () => {
  assert.equal(isSameOriginRequest({ origin: null, referer: `${SITE}/account/register`, secFetchSite: null }, prod), true);
  assert.equal(isSameOriginRequest({ origin: null, referer: "https://evil.com/x", secFetchSite: null }, prod), false);
  assert.equal(isSameOriginRequest({ origin: null, referer: null, secFetchSite: null }, prod), false);
});

test("ALLOWED_ORIGINS parsing drops invalid entries and normalizes", () => {
  assert.deepEqual(parseOriginList(" https://nagsbeautysupply.com/ , not a url, ftp://x.com, https://www.nagsbeautysupply.com/path "), [
    "https://nagsbeautysupply.com",
    "https://www.nagsbeautysupply.com",
  ]);
});

test("isNetlifyDeployOriginOf requires a *.netlify.app configured site", () => {
  assert.equal(isNetlifyDeployOriginOf("https://main--nagsbeautysupply.netlify.app", "https://nagsbeautysupply.com"), false);
});
