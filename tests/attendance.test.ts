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

  it("adds present-only future activities without increasing the denominator", () => {
    const data: AppData = { ...base, profile: { name: "A", course: "CS", presentHours: 188, totalHours: 242, target: 85 }, timetable: [{ id: "co", weekday: 1, subject: "Co-curricular", startTime: "09:00", endTime: "12:00", duration: 18, categoryId: "cocurricular" }], records: [] };
    const metrics = calculateMetrics(data);
    expect(metrics.projectedPresent).toBe(206);
    expect(metrics.projectedTotal).toBe(242);
    expect(metrics.projectedPercentage).toBeCloseTo(85.12, 2);
  });

  it("handles total-only, ignored, and selected simultaneous absences", () => {
    const categories = [...DEFAULT_CATEGORIES, { id: "exam", name: "Exam", mode: "totalOnly" as const, color: "#000" }];
    const data: AppData = { ...base, categories, timetable: [
      { id: "normal-1", weekday: 1, subject: "Math", startTime: "09:00", endTime: "10:00", duration: 1, categoryId: "normal" },
      { id: "normal-2", weekday: 1, subject: "Science", startTime: "10:00", endTime: "12:00", duration: 2, categoryId: "normal" },
      { id: "exam", weekday: 1, subject: "Exam", startTime: "13:00", endTime: "14:00", duration: 1, categoryId: "exam" },
      { id: "ignored", weekday: 1, subject: "Library", startTime: "14:00", endTime: "15:00", duration: 1, categoryId: "library" },
    ], records: [] };
    const metrics = calculateMetrics(data, { plannedEventIds: ["normal-1", "normal-2", "exam", "ignored"] });
    expect(metrics.selectedScheduledHours).toBe(4);
    expect(metrics.selectedCountedHours).toBe(4);
    expect(metrics.projectedPresent).toBe(30);
    expect(metrics.projectedTotal).toBe(44);
    expect(metrics.projectedPercentage).toBeCloseTo(68.18, 2);
  });

  it("treats a full-day selection as selected future events while excluded activities remain neutral", () => {
    const data: AppData = { ...base, timetable: [
      { id: "m1", weekday: 2, subject: "Math", startTime: "09:00", endTime: "11:00", duration: 2, categoryId: "normal" },
      { id: "m2", weekday: 2, subject: "Club", startTime: "11:00", endTime: "12:00", duration: 1, categoryId: "cocurricular" },
      { id: "m3", weekday: 2, subject: "Meeting", startTime: "12:00", endTime: "13:00", duration: 1, categoryId: "meeting" },
    ], records: [] };
    const metrics = calculateMetrics(data, { plannedEventIds: ["m1", "m2"] });
    expect(metrics.selectedEventCount).toBe(2);
    expect(metrics.selectedScheduledHours).toBe(3);
    expect(metrics.selectedCountedHours).toBe(2);
    expect(metrics.projectedTotal).toBe(42);
    expect(metrics.projectedPresent).toBe(30);
  });

  it("keeps historical marked attendance stable after category behavior changes", () => {
    const data: AppData = { ...base, timetable: [{ id: "past", weekday: 1, subject: "Activity", startTime: "09:00", endTime: "10:00", duration: 1, categoryId: "cocurricular" }], records: [{ eventId: "past", state: "present", date: "2026-08-25", presentHours: 1, totalHours: 0 }] };
    const changedCategories = data.categories.map((category) => category.id === "cocurricular" ? { ...category, mode: "excluded" as const } : category);
    const metrics = calculateMetrics({ ...data, categories: changedCategories });
    expect(metrics.present).toBe(31);
    expect(metrics.total).toBe(40);
  });

  it("covers achieved, below-target, exactly-achieved, and zero-remaining states", () => {
    expect(calculateMetrics({ ...base, profile: { ...base.profile!, target: 70 } }).status).toBe("safe");
    expect(calculateMetrics({ ...base, profile: { ...base.profile!, target: 85 } }).status).toBe("risk");
    const exact = calculateMetrics(base);
    expect(exact.percentage).toBe(75);
    expect(exact.status).toBe("safe");
    expect(exact.futureHours).toBe(0);
  });

  it("reports a 100% target as achievable only when a perfect result is already preserved", () => {
    const perfect: AppData = { ...base, profile: { ...base.profile!, presentHours: 10, totalHours: 10, target: 100 } };
    expect(calculateMetrics(perfect).achievable).toBe(true);
    const notPerfect: AppData = { ...perfect, profile: { ...perfect.profile!, presentHours: 9 } };
    expect(calculateMetrics(notPerfect).achievable).toBe(false);
  });
});
