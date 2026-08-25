import { describe, expect, it } from "vitest";
import { calculateMetrics, DEFAULT_CATEGORIES, type AppData } from "@/shared/attendance";

const base: AppData = { profile: { name: "A", course: "CS", presentHours: 30, totalHours: 40, target: 75 }, categories: DEFAULT_CATEGORIES, timetable: [], records: [] };

describe("attendance engine", () => {
  it("calculates current percentage and safe absence", () => {
    const metrics = calculateMetrics(base);
    expect(metrics.percentage).toBe(75);
    expect(metrics.safeAbsence).toBe(0);
    expect(metrics.status).toBe("safe");
  });
  it("handles a planned absence without mutating saved data", () => {
    const metrics = calculateMetrics(base, 5);
    expect(metrics.projectedPercentage).toBeCloseTo(66.67, 1);
    expect(base.profile?.totalHours).toBe(40);
  });
  it("excludes ignored categories from both totals", () => {
    const data: AppData = { ...base, timetable: [{ id: "x", weekday: 1, subject: "Library", startTime: "09:00", endTime: "10:00", duration: 1, categoryId: "library" }], records: [{ eventId: "x", state: "present", date: "2026-08-25" }] };
    expect(calculateMetrics(data).total).toBe(40);
    expect(calculateMetrics(data).present).toBe(30);
  });
  it("marks an impossible target as not achievable when no future classes remain", () => {
    const data: AppData = { ...base, profile: { ...base.profile!, target: 100 } };
    expect(calculateMetrics(data).achievable).toBe(false);
  });
});
