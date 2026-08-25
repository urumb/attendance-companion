import type { AppData } from "@/shared/attendance";
import { DEFAULT_CATEGORIES } from "@/shared/attendance";

export const APP_STORAGE_KEY = "attendance-companion:data:v1";

export type KeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export function createFirstLaunchData(): AppData {
  return {
    profile: null,
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    timetable: [],
    records: [],
  };
}

export async function hydrateAppData(storage: KeyValueStorage): Promise<{ data: AppData; shouldPersist: boolean }> {
  const raw = await storage.getItem(APP_STORAGE_KEY);
  if (!raw) return { data: createFirstLaunchData(), shouldPersist: false };
  try {
    return { data: { ...createFirstLaunchData(), ...JSON.parse(raw) }, shouldPersist: true };
  } catch {
    return { data: createFirstLaunchData(), shouldPersist: false };
  }
}

export async function clearPersistedAppData(storage: KeyValueStorage): Promise<AppData> {
  await storage.removeItem(APP_STORAGE_KEY);
  return createFirstLaunchData();
}

export function createPersistenceController(storage: KeyValueStorage) {
  let queue: Promise<void> = Promise.resolve();
  let enabled = false;
  let generation = 0;

  const enqueue = (operation: () => Promise<void>) => {
    const next = queue.then(operation, operation);
    queue = next.catch(() => undefined);
    return next;
  };

  return {
    setEnabled(value: boolean) {
      enabled = value;
    },
    persist(data: AppData) {
      const scheduledGeneration = generation;
      const snapshot = JSON.stringify(data);
      return enqueue(async () => {
        if (!enabled || scheduledGeneration !== generation) return;
        await storage.setItem(APP_STORAGE_KEY, snapshot);
      });
    },
    async reset() {
      enabled = false;
      generation += 1;
      await enqueue(async () => {
        await storage.removeItem(APP_STORAGE_KEY);
      });
      return createFirstLaunchData();
    },
  };
}
