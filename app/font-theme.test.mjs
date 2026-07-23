import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const globalsCss = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const layoutTsx = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

test("classical Chinese serif utility is backed by a loaded font variable", () => {
  assert.match(globalsCss, /--font-serif-sc:\s*var\(--font-noto-serif-sc\)/);
  assert.match(layoutTsx, /Noto_Serif_SC/);
  assert.match(layoutTsx, /variable:\s*["']--font-noto-serif-sc["']/);
});
