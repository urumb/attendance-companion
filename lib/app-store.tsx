import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyEventToTotals, AppData, AttendanceCategory, AttendanceProfile, AttendanceRecord, DEFAULT_CATEGORIES, TimetableEvent } from "@/shared/attendance";

const STORAGE_KEY = "attendance-companion:data:v1";
const emptyData: AppData = { profile: null, categories: DEFAULT_CATEGORIES, timetable: [], records: [] };

type Store = AppData & {
  hydrated: boolean;
  saveProfile: (profile: AttendanceProfile) => void;
  saveCategories: (categories: AttendanceCategory[]) => void;
  saveTimetable: (timetable: TimetableEvent[]) => void;
  markAttendance: (record: AttendanceRecord) => void;
  reset: () => void;
};
const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) { try { setData({ ...emptyData, ...JSON.parse(raw) }); } catch { /* ignore corrupt local data */ } }
      setHydrated(true);
    });
  }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data, hydrated]);
  const value = useMemo<Store>(() => ({
    ...data,
    hydrated,
    saveProfile: (profile) => setData((current) => ({ ...current, profile })),
    saveCategories: (categories) => setData((current) => ({
      ...current,
      categories,
      records: current.records.map((record) => {
        if (typeof record.presentHours === "number" && typeof record.totalHours === "number") return record;
        const event = current.timetable.find((item) => item.id === record.eventId);
        if (!event) return record;
        const snapshot = applyEventToTotals(event, record.state, current.categories);
        return { ...record, presentHours: snapshot.present, totalHours: snapshot.total };
      }),
    })),
    saveTimetable: (timetable) => setData((current) => ({ ...current, timetable })),
    markAttendance: (record) => setData((current) => {
      const event = current.timetable.find((item) => item.id === record.eventId);
      const snapshot = event ? applyEventToTotals(event, record.state, current.categories) : { present: 0, total: 0 };
      return { ...current, records: [...current.records.filter((item) => item.eventId !== record.eventId), { ...record, presentHours: snapshot.present, totalHours: snapshot.total }] };
    }),
    reset: () => setData(emptyData),
  }), [data, hydrated]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useAppStore() { const value = useContext(StoreContext); if (!value) throw new Error("AppStoreProvider is missing"); return value; }
