import type { AttendanceCategory, TimetableEvent } from "./attendance";

export type ExtractedTimetableRow = {
  weekday: string | number;
  subject: string;
  startTime: string;
  endTime: string;
  duration?: number | null;
  categoryHint?: string | null;
  confidence?: number | null;
};

export type ExtractionResponse = {
  events: ExtractedTimetableRow[];
  warnings?: string[];
};

const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function normaliseWeekday(value: string | number): number | null {
  if (typeof value === "number") return Number.isInteger(value) && value >= 0 && value <= 6 ? value : null;
  const cleaned = value.trim().toLowerCase();
  const exact = weekdayNames.indexOf(cleaned);
  if (exact >= 0) return exact;
  const short = weekdayNames.findIndex((day) => day.startsWith(cleaned.slice(0, 3)));
  return short >= 0 ? short : null;
}

export function normaliseTime(value: string): string | null {
  const text = value.trim().toLowerCase().replace(/\./g, "");
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const suffix = match[3];
  if (minutes > 59 || hours > 23 || hours < 0) return null;
  if (suffix) {
    if (hours < 1 || hours > 12) return null;
    if (suffix === "pm" && hours !== 12) hours += 12;
    if (suffix === "am" && hours === 12) hours = 0;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function durationBetween(startTime: string, endTime: string): number | null {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const difference = toMinutes(endTime) - toMinutes(startTime);
  return difference > 0 ? Math.round((difference / 60) * 100) / 100 : null;
}

function categoryIdFor(categories: AttendanceCategory[], hint?: string | null) {
  const normalisedHint = hint?.trim().toLowerCase();
  if (normalisedHint) {
    const matched = categories.find((category) =>
      category.name.toLowerCase().includes(normalisedHint) || normalisedHint.includes(category.name.toLowerCase()),
    );
    if (matched) return matched.id;
  }
  return categories[0]?.id ?? "normal";
}

export function transformExtractedTimetable(
  extraction: ExtractionResponse,
  categories: AttendanceCategory[],
): { events: TimetableEvent[]; warnings: string[] } {
  const warnings = [...(extraction.warnings ?? [])];
  const events = extraction.events.flatMap((row, index) => {
    const weekday = normaliseWeekday(row.weekday);
    const startTime = normaliseTime(row.startTime);
    const endTime = normaliseTime(row.endTime);
    const subject = row.subject?.trim();
    const calculatedDuration = startTime && endTime ? durationBetween(startTime, endTime) : null;
    const duration = typeof row.duration === "number" && row.duration > 0 ? row.duration : calculatedDuration;
    if (weekday === null || !startTime || !endTime || !duration || !subject) {
      warnings.push(`Skipped one incomplete extracted row near position ${index + 1}.`);
      return [];
    }
    return [{
      id: `ocr-${Date.now()}-${index}`,
      weekday,
      subject,
      startTime,
      endTime,
      duration,
      categoryId: categoryIdFor(categories, row.categoryHint),
    }];
  });
  return { events, warnings };
}
