import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dockerfiles = ["Dockerfile", "services/api/Dockerfile"];

for (const dockerfile of dockerfiles) {
  test(`${dockerfile} installs Jiayan without relying on submodule contents`, () => {
    const content = readFileSync(new URL(dockerfile, import.meta.url), "utf8");

    assert.doesNotMatch(content, /COPY\s+third_party\/Jiayan\s+\/tmp\/Jiayan/);
    assert.match(content, /pip install git\+https:\/\/github\.com\/jiaeyan\/Jiayan\.git@/);
  });
}
