import { describe, expect, it } from "vitest";
import { APP_STORAGE_KEY, clearPersistedAppData, createFirstLaunchData, createPersistenceController, hydrateAppData } from "@/lib/app-store-storage";

function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => { data.set(key, value); },
    removeItem: async (key: string) => { data.delete(key); },
    has: (key: string) => data.has(key),
  };
}

describe("app-store reset persistence", () => {
  it("removes persisted profile, attendance totals, target, timetable, records, and custom categories", async () => {
    const storage = memoryStorage({
      [APP_STORAGE_KEY]: JSON.stringify({
        profile: { name: "Student", course: "AI", presentHours: 188, totalHours: 242, target: 85 },
        categories: [{ id: "custom", name: "Custom", mode: "both", color: "#000" }],
        timetable: [{ id: "class", weekday: 1, subject: "Class", startTime: "09:00", endTime: "10:00", duration: 1, categoryId: "custom" }],
        records: [{ eventId: "class", state: "present", date: "2026-08-25", presentHours: 1, totalHours: 1 }],
      }),
    });
    const firstLaunch = await clearPersistedAppData(storage);
    expect(storage.has(APP_STORAGE_KEY)).toBe(false);
    expect(firstLaunch.profile).toBeNull();
    expect(firstLaunch.timetable).toEqual([]);
    expect(firstLaunch.records).toEqual([]);
    expect(firstLaunch.categories.map((category) => category.id)).toEqual(["normal", "cocurricular", "library", "meeting", "project"]);
  });

  it("rehydrates to first launch after reset and does not restore deleted values", async () => {
    const storage = memoryStorage();
    const rehydrated = await hydrateAppData(storage);
    expect(rehydrated.shouldPersist).toBe(false);
    expect(rehydrated.data.profile).toBeNull();
    expect(rehydrated.data.timetable).toHaveLength(0);
    expect(rehydrated.data.records).toHaveLength(0);
    expect(rehydrated.data.categories).toHaveLength(5);
  });

  it("does not let a queued stale write repopulate storage after reset", async () => {
    const storage = memoryStorage();
    const persistence = createPersistenceController(storage);
    persistence.setEnabled(true);
    const oldData = { ...createFirstLaunchData(), profile: { name: "Student", course: "AI", presentHours: 188, totalHours: 242, target: 85 } };
    const pendingWrite = persistence.persist(oldData);
    const reset = persistence.reset();
    await Promise.all([pendingWrite, reset]);
    expect(storage.has(APP_STORAGE_KEY)).toBe(false);
    expect((await hydrateAppData(storage)).data.profile).toBeNull();
  });
});
