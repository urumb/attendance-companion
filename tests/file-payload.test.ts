import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { browserFileToBase64, browserFileToText, decodeBrowserBase64Utf8, stripBrowserDataUri } from "@/shared/file-payload";

describe("browser timetable file payloads", () => {
  it("reads browser File/Blob text without Expo FileSystem", async () => {
    const file = new Blob(["MON,09:00,10:00,Reinforcement Learning\n"], { type: "text/csv" });
    await expect(browserFileToText(file)).resolves.toContain("Reinforcement Learning");
  });

  it("converts browser Blob bytes to the base64 payload expected by the server", async () => {
    const file = new Blob(["timetable-image-bytes"], { type: "image/png" });
    const encoded = await browserFileToBase64(file);
    expect(decodeBrowserBase64Utf8(encoded)).toBe("timetable-image-bytes");
    expect(stripBrowserDataUri(`data:image/png;base64,${encoded}`)).toBe(encoded);
  });

  it("keeps native reading behind an explicit non-web platform branch", () => {
    const source = readFileSync(join(process.cwd(), "app/import.tsx"), "utf8");
    expect(source).toContain('if (Platform.OS === "web")');
    expect(source).toContain("FileSystem.readAsStringAsync");
    expect(source).toContain("result.output?.[0]");
    expect(source).toContain("copyToCacheDirectory:true,base64:true");
  });
});
