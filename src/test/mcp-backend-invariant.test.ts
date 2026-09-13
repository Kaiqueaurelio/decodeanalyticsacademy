import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const activeRef = "wxkkpjpqyrygglbuogsd";

describe("MCP production backend", () => {
  it("keeps source, generated function and Lovable manifest on the active issuer", () => {
    const source = read("src/lib/mcp/index.ts");
    const generated = read("supabase/functions/mcp/index.ts");
    const manifest = JSON.parse(read(".lovable/mcp/manifest.json"));

    expect(source).toContain(`const projectRef = "${activeRef}"`);
    expect(generated).toContain(`var projectRef = "${activeRef}"`);
    expect(manifest.auth.issuer).toBe(`https://${activeRef}.supabase.co/auth/v1`);
    for (const content of [source, generated, JSON.stringify(manifest)]) {
      expect(content).not.toMatch(/gynguskgysompgcajunc|qwnblxmlgcpjuhdzslju|project-ref-unset/);
    }
  });
});
