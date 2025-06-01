import { minimatch } from "minimatch";
import { strictEqual } from "node:assert";
import { describe, test } from "node:test";

describe("ignorePatterns", () => {
  test("ignore patterns", () => {
    const ignorePatterns = ["**/blog", "**/blog/**"]; // 修改此行

    const urlsToIgnore = [
      "https://blog.kingsword.tech/docusaurus-plugin-llms-builder/blog/archive",
      "https://blog.kingsword.tech/docusaurus-plugin-llms-builder/blog",
    ];

    const urlsNotToIgnore = [
      "https://blog.kingsword.tech/docusaurus-plugin-llms-builder/docs/intro",
      "https://example.com/other/path",
    ];

    urlsToIgnore.forEach((url) => {
      const isIgnored = ignorePatterns.some((pattern) => minimatch(url, pattern));
      strictEqual(isIgnored, true, `URL "${url}" should be ignored`);
    });

    urlsNotToIgnore.forEach((url) => {
      const isIgnored = ignorePatterns.some((pattern) => minimatch(url, pattern));
      strictEqual(isIgnored, false, `URL "${url}" should NOT be ignored`);
    });
  });
});
