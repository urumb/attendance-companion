export type AttendanceState = "present" | "absent" | "excused" | "ignored";
export type CategoryMode = "both" | "presentOnly" | "totalOnly" | "excluded";

export type AttendanceCategory = {
  id: string;
  name: string;
  mode: CategoryMode;
  color: string;
};

export type TimetableEvent = {
  id: string;
  weekday: number;
  subject: string;
  startTime: string;
  endTime: string;
  duration: number;
  categoryId: string;
  date?: string;
};

export type AttendanceRecord = {
  eventId: string;
  state: AttendanceState;
  date: string;
  presentHours?: number;
  totalHours?: number;
};

export type AttendanceProfile = {
  name: string;
  course: string;
  presentHours: number;
  totalHours: number;
  target: number;
};

export type AppData = {
  profile: AttendanceProfile | null;
  categories: AttendanceCategory[];
  timetable: TimetableEvent[];
  records: AttendanceRecord[];
};

export type AttendanceScenario = {
  manualAbsenceHours?: number;
  plannedEventIds?: string[];
};

export const DEFAULT_CATEGORIES: AttendanceCategory[] = [
  { id: "normal", name: "Normal class", mode: "both", color: "#3155D9" },
  { id: "cocurricular", name: "Co-curricular", mode: "presentOnly", color: "#6B7CFF" },
  { id: "library", name: "Library", mode: "excluded", color: "#7B8794" },
  { id: "meeting", name: "Meeting", mode: "excluded", color: "#A0AEC0" },
  { id: "project", name: "Project review", mode: "excluded", color: "#B7791F" },
];

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function categoryFor(categories: AttendanceCategory[], id: string) {
  return categories.find((category) => category.id === id) ?? categories[0] ?? DEFAULT_CATEGORIES[0];
}

export function applyEventToTotals(
  event: TimetableEvent,
  state: AttendanceState,
  categories: AttendanceCategory[],
) {
  const category = categoryFor(categories, event.categoryId);
  if (category.mode === "excluded" || state === "ignored" || state === "excused") return { present: 0, total: 0 };
  const countsPresent = category.mode === "both" || category.mode === "presentOnly";
  const countsTotal = category.mode === "both" || category.mode === "totalOnly";
  return { present: countsPresent && state === "present" ? event.duration : 0, total: countsTotal ? event.duration : 0 };
}

export function eventPotential(event: TimetableEvent, categories: AttendanceCategory[]) {
  const category = categoryFor(categories, event.categoryId);
  if (category.mode === "excluded") return { present: 0, total: 0, scheduled: 0 };
  return {
    present: category.mode === "both" || category.mode === "presentOnly" ? event.duration : 0,
    total: category.mode === "both" || category.mode === "totalOnly" ? event.duration : 0,
    scheduled: event.duration,
  };
}

export function calculateMetrics(data: AppData, scenario: number | AttendanceScenario = 0) {
  const resolvedScenario = typeof scenario === "number" ? { manualAbsenceHours: scenario, plannedEventIds: [] } : scenario;
  const manualAbsenceHours = Math.max(0, resolvedScenario.manualAbsenceHours ?? 0);
  const plannedEventIds = new Set(resolvedScenario.plannedEventIds ?? []);
  const profile = data.profile ?? { name: "", course: "", presentHours: 0, totalHours: 0, target: 75 };
  const actual = data.timetable.reduce((sum, event) => {
    const record = data.records.find((item) => item.eventId === event.id);
    if (!record) return sum;
    const delta = typeof record.presentHours === "number" && typeof record.totalHours === "number"
      ? { present: record.presentHours, total: record.totalHours }
      : applyEventToTotals(event, record.state, data.categories);
    return { present: sum.present + delta.present, total: sum.total + delta.total };
  }, { present: 0, total: 0 });
  const present = Math.max(0, profile.presentHours + actual.present);
  const total = Math.max(0, profile.totalHours + actual.total);
  const future = data.timetable.filter((event) => !data.records.some((record) => record.eventId === event.id));
  const selectedEvents = future.filter((event) => plannedEventIds.has(event.id));
  const futureTotals = future.reduce((sum, event) => {
    const potential = eventPotential(event, data.categories);
    if (plannedEventIds.has(event.id)) {
      return { present: sum.present, total: sum.total + potential.total };
    }
    return {
      present: sum.present + potential.present,
      total: sum.total + potential.total,
    };
  }, { present: 0, total: 0 });
  const selectedImpact = selectedEvents.reduce((sum, event) => {
    const potential = eventPotential(event, data.categories);
    return { scheduled: sum.scheduled + potential.scheduled, counted: sum.counted + potential.total, present: sum.present + potential.present };
  }, { scheduled: 0, counted: 0, present: 0 });
  const projectedTotal = total + futureTotals.total + manualAbsenceHours;
  const projectedPresent = Math.max(0, present + futureTotals.present);
  const percentage = total > 0 ? (present / total) * 100 : 0;
  const projectedPercentage = projectedTotal > 0 ? (projectedPresent / projectedTotal) * 100 : percentage;
  const target = Math.min(100, Math.max(0, profile.target));
  const safeAbsence = target >= 100 ? (percentage >= 100 ? 0 : 0) : Math.max(0, present / (target / 100) - total);
  const hoursNeeded = Math.max(0, (target / 100) * total - present);
  const maxFutureMiss = Math.max(0, futureTotals.total - Math.max(0, ((present + futureTotals.present) / (target / 100 || 1)) - (total + futureTotals.total)));
  const achievable = target === 100 ? futureTotals.total === 0 && percentage >= 100 : (present + futureTotals.present) / Math.max(1, total + futureTotals.total) * 100 >= target;
  return {
    present,
    total,
    percentage,
    target,
    futureHours: futureTotals.total,
    safeAbsence,
    hoursNeeded,
    projectedPresent,
    projectedTotal,
    projectedPercentage,
    maxFutureMiss,
    achievable,
    selectedEventCount: selectedEvents.length,
    selectedScheduledHours: selectedImpact.scheduled,
    selectedCountedHours: selectedImpact.counted,
    selectedPresentHours: selectedImpact.present,
    plannedAbsenceHours: manualAbsenceHours + selectedImpact.counted,
    status: percentage >= target ? "safe" : percentage >= target - 5 ? "watch" : "risk",
    projectedStatus: projectedPercentage >= target ? "safe" : projectedPercentage >= target - 5 ? "watch" : "risk",
  } as const;
}

export function parseTimetableText(text: string, categories: AttendanceCategory[]): TimetableEvent[] {
  const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parsed = rows.flatMap((row, index) => {
    const parts = row.split(/[,\t|;]/).map((part) => part.trim());
    if (parts.length < 3) return [];
    const weekday = Math.max(0, WEEKDAYS.findIndex((day) => day.toLowerCase().startsWith(parts[0].toLowerCase())));
    const times = parts.find((part) => /\d{1,2}:\d{2}/.test(part)) ?? "09:00-10:00";
    const [startTime = "09:00", endTime = "10:00"] = times.split(/\s*(?:-|–|to)\s*/i);
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const duration = Math.max(0.5, ((eh * 60 + (em || 0)) - (sh * 60 + (sm || 0))) / 60 || 1);
    const category = categories.find((item) => parts.some((part) => part.toLowerCase().includes(item.name.toLowerCase()))) ?? categories[0];
    return [{ id: `event-${Date.now()}-${index}`, weekday, subject: parts[1] || `Imported class ${index + 1}`, startTime, endTime, duration, categoryId: category.id }];
  });
  return parsed;
}
