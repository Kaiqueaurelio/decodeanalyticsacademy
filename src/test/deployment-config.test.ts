import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel deployment cache policy", () => {
  it("does not cache SPA entrypoints or service workers", () => {
    const config = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8"),
    ) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };

    const ruleFor = (source: string) => config.headers.find((rule) => rule.source === source);
    const cacheFor = (source: string) =>
      ruleFor(source)?.headers.find((header) => header.key === "Cache-Control")?.value;

    expect(cacheFor("/(.*)")).toContain("no-store");
    expect(cacheFor("/sw.js")).toContain("no-store");
    expect(cacheFor("/sw-push.js")).toContain("no-store");
    expect(cacheFor("/assets/(.*)")).toBe("public, max-age=31536000, immutable");
  });
});
