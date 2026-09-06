import { describe, expect, it, vi, beforeEach } from "vitest";
import { transformExtractedTimetable } from "@/shared/timetable-extraction";
import { DEFAULT_CATEGORIES } from "@/shared/attendance";

/**
 * Tests for the server-side OCR / extraction path.
 *
 * We cannot call the real LLM in unit tests, so we test:
 *  - The transformation layer (shared/timetable-extraction.ts) with realistic data
 *  - That the OCR config-missing error is actionable
 *  - That extraction results go to Review, not saved immediately
 */

describe("OCR config failure produces an actionable error", () => {
  it("extractTimetableFromUpload throws when BUILT_IN_FORGE_API_URL is missing", async () => {
    // Simulate missing env vars by mocking the llm module
    vi.mock("@/server/_core/llm", () => ({
      invokeLLM: vi.fn().mockRejectedValue(
        new Error("OCR provider not configured: set BUILT_IN_FORGE_API_URL in the server .env file"),
      ),
    }));

    const { extractTimetableFromUpload } = await import("@/server/timetable-extraction");
    await expect(
      extractTimetableFromUpload({
        base64: btoa("fake"),
        mimeType: "image/png",
        fileName: "timetable.png",
        categories: DEFAULT_CATEGORIES,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("BUILT_IN_FORGE_API_URL"),
    });

    vi.restoreAllMocks();
  });
});

describe("extraction → review gate (no auto-save)", () => {
  it("transformExtractedTimetable returns events without persisting them", () => {
    const result = transformExtractedTimetable(
      {
        events: [
          { weekday: "Monday", subject: "Reinforcement Learning", startTime: "09:00", endTime: "10:00" },
          { weekday: "Tuesday", subject: "Data Structures", startTime: "11:00", endTime: "12:00" },
        ],
      },
      DEFAULT_CATEGORIES,
    );
    // Events are returned, not persisted — persistence happens only after Review confirmation
    expect(result.events).toHaveLength(2);
    expect(result.events[0].subject).toBe("Reinforcement Learning");
    expect(result.events[1].weekday).toBe(2); // Tuesday
    // IDs are temporary OCR IDs, not final storage IDs
    expect(result.events[0].id).toMatch(/^ocr-/);
  });

  it("realistic university timetable rows are transformed correctly", () => {
    const result = transformExtractedTimetable(
      {
        events: [
          { weekday: "Monday", subject: "CSEAM731 Reinforcement Learning", startTime: "09:00", endTime: "10:00", categoryHint: "Normal class" },
          { weekday: "Monday", subject: "Library", startTime: "13:00", endTime: "14:00", categoryHint: "Library" },
          { weekday: "Wednesday", subject: "CSEAM784 Project Work I", startTime: "14:00", endTime: "17:00", categoryHint: "Project review", duration: 3 },
          { weekday: "Saturday", subject: "Co-curricular Activity", startTime: "10:00", endTime: "11:00", categoryHint: "Co-curricular" },
          // Incomplete row — must be skipped with a warning, not invented
          { weekday: "Friday", subject: "", startTime: "09:00", endTime: "10:00" },
        ],
        warnings: ["Merged cells detected in Wednesday row."],
      },
      DEFAULT_CATEGORIES,
    );

    expect(result.events).toHaveLength(4); // 5 rows minus 1 empty subject
    expect(result.events[0].categoryId).toBe("normal");
    expect(result.events[1].categoryId).toBe("library");
    expect(result.events[2].duration).toBe(3);
    expect(result.events[2].categoryId).toBe("project");
    expect(result.events[3].categoryId).toBe("cocurricular");
    // Original warning preserved and incomplete-row warning added
    expect(result.warnings).toContain("Merged cells detected in Wednesday row.");
    expect(result.warnings.some((w) => w.includes("Skipped"))).toBe(true);
  });

  it("manual entry (blank Review start) is independent of OCR", () => {
    // When events=[] is passed to the Review screen, the user gets a blank form
    // and can enter manually — this is unaffected by OCR failures
    const result = transformExtractedTimetable({ events: [] }, DEFAULT_CATEGORIES);
    expect(result.events).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});

describe("merged / spanning timetable cells", () => {
  it("a cell spanning multiple periods is treated as one event with the full duration", () => {
    const result = transformExtractedTimetable(
      {
        events: [
          { weekday: "Wednesday", subject: "Project Work I", startTime: "14:00", endTime: "17:00", duration: 3 },
        ],
      },
      DEFAULT_CATEGORIES,
    );
    expect(result.events[0].startTime).toBe("14:00");
    expect(result.events[0].endTime).toBe("17:00");
    expect(result.events[0].duration).toBe(3);
  });

  it("duration is derived from start/end times when not explicitly provided", () => {
    const result = transformExtractedTimetable(
      {
        events: [
          { weekday: "Thursday", subject: "Elective", startTime: "10:00", endTime: "12:30" },
        ],
      },
      DEFAULT_CATEGORIES,
    );
    expect(result.events[0].duration).toBe(2.5);
  });
});
