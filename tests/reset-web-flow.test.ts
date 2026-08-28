import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("web reset flow", () => {
  it("uses browser confirmation and first-launch navigation on web", () => {
    const source = readFileSync(join(process.cwd(), "app/(tabs)/settings.tsx"), "utf8");
    expect(source).toContain('Platform.OS==="web"');
    expect(source).toContain("window.confirm");
    expect(source).toContain('router.replace("/")');
    expect(source).toContain("store.reset()");
  });
});
