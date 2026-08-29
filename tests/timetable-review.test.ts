import { describe, expect, it } from "vitest";
import { groupTimetableEvents, timetableNeedsReview } from "@/shared/timetable-review";
import { browserFileToBase64, browserFileToText, decodeBrowserBase64Utf8, stripBrowserDataUri } from "@/shared/file-payload";
import type { TimetableEvent } from "@/shared/attendance";

const event = (id: string, weekday: number, startTime: string, subject = id): TimetableEvent => ({ id, weekday, subject, startTime, endTime: "10:00", duration: 1, categoryId: "normal" });

describe("timetable review", () => {
  it("groups by weekday and sorts each group chronologically without mutating input", () => {
    const input = [event("late", 2, "14:00"), event("early", 1, "08:00"), event("first", 2, "09:00")];
    const groups = groupTimetableEvents(input);
    expect(groups.map((group) => group.weekday)).toEqual([1, 2]);
    expect(groups[1].events.map((item) => item.id)).toEqual(["first", "late"]);
    expect(input.map((item) => item.id)).toEqual(["late", "early", "first"]);
  });

  it("flags incomplete or invalid review rows and accepts complete rows", () => {
    expect(timetableNeedsReview(event("missing subject", 1, "09:00", ""))).toBe(true);
    expect(timetableNeedsReview({ ...event("bad time", 1, "9:00"), endTime: "10:00" })).toBe(true);
    expect(timetableNeedsReview({ ...event("complete", 1, "09:00"), endTime: "10:00", duration: 1 })).toBe(false);
  });
});

describe("browser timetable file payloads", () => {
  it("strips data URI prefixes and decodes UTF-8 base64 text", () => {
    const encoded = btoa(unescape(encodeURIComponent("Monday,Math\n")));
    expect(stripBrowserDataUri(`data:text/csv;base64,${encoded}`)).toBe(encoded);
    expect(decodeBrowserBase64Utf8(`data:text/csv;base64,${encoded}`)).toBe("Monday,Math\n");
  });

  it("reads browser File objects for text and base64 payloads", async () => {
    const file = new File(["Monday,Math\n"], "timetable.csv", { type: "text/csv" });
    expect(await browserFileToText(file)).toBe("Monday,Math\n");
    expect(await browserFileToBase64(file)).toBe(btoa("Monday,Math\n"));
  });
});
