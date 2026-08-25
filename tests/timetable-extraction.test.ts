import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "@/shared/attendance";
import { durationBetween, normaliseTime, transformExtractedTimetable } from "@/shared/timetable-extraction";

describe("timetable extraction transformation", () => {
  it("normalises 12-hour and 24-hour timetable times", () => {
    expect(normaliseTime("9 am")).toBe("09:00");
    expect(normaliseTime("12:30 PM")).toBe("12:30");
    expect(normaliseTime("14:15")).toBe("14:15");
  });

  it("turns a spanning timetable cell into one event covering the full duration", () => {
    const result = transformExtractedTimetable({
      events: [{ weekday: "Monday", subject: "Operating Systems", startTime: "09:00", endTime: "12:00", categoryHint: "Normal class" }],
    }, DEFAULT_CATEGORIES);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ weekday: 1, startTime: "09:00", endTime: "12:00", duration: 3, categoryId: "normal" });
  });

  it("keeps parser warnings and rejects incomplete OCR rows instead of inventing values", () => {
    const result = transformExtractedTimetable({
      warnings: ["Merged cell needed review."],
      events: [
        { weekday: "Tuesday", subject: "Physics", startTime: "11:00", endTime: "12:30", categoryHint: "Co-curricular" },
        { weekday: "Wednesday", subject: "", startTime: "09:00", endTime: "10:00" },
      ],
    }, DEFAULT_CATEGORIES);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].categoryId).toBe("cocurricular");
    expect(result.warnings).toContain("Merged cell needed review.");
    expect(result.warnings.join(" ")).toContain("Skipped one incomplete");
  });

  it("does not allow non-positive time ranges", () => {
    expect(durationBetween("10:00", "10:00")).toBeNull();
    expect(durationBetween("13:00", "12:00")).toBeNull();
  });
});
