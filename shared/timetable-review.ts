import { WEEKDAYS, type TimetableEvent } from "./attendance";

export type TimetableReviewGroup = {
  weekday: number;
  label: string;
  events: TimetableEvent[];
};

function minutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

export function groupTimetableEvents(events: TimetableEvent[]): TimetableReviewGroup[] {
  const grouped = new Map<number, TimetableEvent[]>();
  for (const event of events) {
    const current = grouped.get(event.weekday) ?? [];
    current.push(event);
    grouped.set(event.weekday, current);
  }
  return [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .map(([weekday, groupEvents]) => ({
      weekday,
      label: WEEKDAYS[weekday] ?? "Choose day",
      events: [...groupEvents].sort((left, right) => minutes(left.startTime) - minutes(right.startTime)),
    }));
}

export function timetableNeedsReview(event: TimetableEvent) {
  return !event.subject.trim() || event.weekday < 0 || event.weekday > 6 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.endTime) || !(event.duration > 0);
}
