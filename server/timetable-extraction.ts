import { invokeLLM } from "./_core/llm";
import type { AttendanceCategory } from "../shared/attendance";
import { transformExtractedTimetable, type ExtractionResponse } from "../shared/timetable-extraction";

const maxBase64Length = 13_000_000;
const supportedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]);

export async function extractTimetableFromUpload(input: {
  base64: string;
  mimeType: string;
  fileName: string;
  categories: AttendanceCategory[];
}) {
  if (!supportedMimeTypes.has(input.mimeType)) throw new Error("Choose a JPG, PNG, WEBP, HEIC, or PDF timetable.");
  if (!input.base64 || input.base64.length > maxBase64Length) throw new Error("This file is too large to parse. Try a smaller image or PDF.");

  const categoryNames = input.categories.map((category) => category.name).join(", ");
  const source = `data:${input.mimeType};base64,${input.base64}`;
  const content = input.mimeType === "application/pdf"
    ? [{ type: "text" as const, text: extractionPrompt(categoryNames) }, { type: "file_url" as const, file_url: { url: source, mime_type: "application/pdf" as const } }]
    : [{ type: "text" as const, text: extractionPrompt(categoryNames) }, { type: "image_url" as const, image_url: { url: source, detail: "high" as const } }];

  const result = await invokeLLM({
    model: "gemini-3-flash-preview",
    max_tokens: 4500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You extract timetable data from uploaded documents. Return valid JSON only; never invent missing classes." },
      { role: "user", content },
    ],
  });
  const raw = result.choices[0]?.message.content;
  if (typeof raw !== "string") throw new Error("The timetable parser returned no readable result.");
  let parsed: ExtractionResponse;
  try { parsed = JSON.parse(raw) as ExtractionResponse; } catch { throw new Error("The timetable parser returned an invalid result. Please enter the timetable manually."); }
  if (!Array.isArray(parsed.events)) throw new Error("No timetable events were found. Please enter the timetable manually.");
  const transformed = transformExtractedTimetable(parsed, input.categories);
  if (!transformed.events.length) throw new Error("No complete timetable rows could be confirmed. Please enter the timetable manually.");
  return transformed;
}

function extractionPrompt(categoryNames: string) {
  return `Read this class timetable. Return JSON with exactly this shape: {"events":[{"weekday":"Monday","subject":"Subject","startTime":"09:00","endTime":"10:00","duration":1,"categoryHint":"Normal class","confidence":0.8}],"warnings":["optional warning"]}. Extract every visible weekday, subject/activity, start time, end time, and duration. Treat cells spanning several periods as one event covering the combined start and end time. Handle merged or repeated subject cells as conservatively as possible. Use 24-hour HH:MM times. If a value is uncertain, include a warning rather than guessing. Available category names: ${categoryNames}.`;
}
