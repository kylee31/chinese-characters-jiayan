import assert from "node:assert/strict";
import test from "node:test";

import { resolveFastApiBaseUrl } from "./fastapi.mjs";

test("resolveFastApiBaseUrl prefers FASTAPI_BASE_URL", () => {
  assert.equal(
    resolveFastApiBaseUrl({
      FASTAPI_BASE_URL: "https://private-api.example.com/",
      NEXT_PUBLIC_API_BASE_URL: "https://public-api.example.com/",
    }),
    "https://private-api.example.com",
  );
});

test("resolveFastApiBaseUrl falls back to NEXT_PUBLIC_API_BASE_URL", () => {
  assert.equal(
    resolveFastApiBaseUrl({
      NEXT_PUBLIC_API_BASE_URL: "https://public-api.example.com/",
    }),
    "https://public-api.example.com",
  );
});
