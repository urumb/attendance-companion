import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { applyEventToTotals, AppData, AttendanceCategory, AttendanceProfile, AttendanceRecord, TimetableEvent } from "@/shared/attendance";
import { createFirstLaunchData, createPersistenceController, hydrateAppData } from "@/lib/app-store-storage";

type Store = AppData & {
  hydrated: boolean;
  saveProfile: (profile: AttendanceProfile) => void;
  saveCategories: (categories: AttendanceCategory[]) => void;
  saveTimetable: (timetable: TimetableEvent[]) => void;
  markAttendance: (record: AttendanceRecord) => void;
  reset: () => Promise<void>;
};
const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => createFirstLaunchData());
  const [hydrated, setHydrated] = useState(false);
  const operationRef = useRef(0);
  const persistenceRef = useRef(createPersistenceController(AsyncStorage));
  useEffect(() => {
    const operation = ++operationRef.current;
    void hydrateAppData(AsyncStorage).then((result) => {
      if (operation !== operationRef.current) return;
      persistenceRef.current.setEnabled(result.shouldPersist);
      setData(result.data);
      setHydrated(true);
    });
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    void persistenceRef.current.persist(data);
  }, [data, hydrated]);
  const value = useMemo<Store>(() => ({
    ...data,
    hydrated,
    saveProfile: (profile) => { persistenceRef.current.setEnabled(true); setData((current) => ({ ...current, profile })); },
    saveCategories: (categories) => { persistenceRef.current.setEnabled(true); setData((current) => ({
      ...current,
      categories,
      records: current.records.map((record) => {
        if (typeof record.presentHours === "number" && typeof record.totalHours === "number") return record;
        const event = current.timetable.find((item) => item.id === record.eventId);
        if (!event) return record;
        const snapshot = applyEventToTotals(event, record.state, current.categories);
        return { ...record, presentHours: snapshot.present, totalHours: snapshot.total };
      }),
    })); },
    saveTimetable: (timetable) => { persistenceRef.current.setEnabled(true); setData((current) => ({ ...current, timetable })); },
    markAttendance: (record) => { persistenceRef.current.setEnabled(true); setData((current) => {
      const event = current.timetable.find((item) => item.id === record.eventId);
      const snapshot = event ? applyEventToTotals(event, record.state, current.categories) : { present: 0, total: 0 };
      return { ...current, records: [...current.records.filter((item) => item.eventId !== record.eventId), { ...record, presentHours: snapshot.present, totalHours: snapshot.total }] };
    }); },
    reset: async () => {
      const operation = ++operationRef.current;
      setHydrated(false);
      const firstLaunchData = await persistenceRef.current.reset();
      if (operation !== operationRef.current) return;
      setData(firstLaunchData);
      setHydrated(true);
    },
  }), [data, hydrated]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useAppStore() { const value = useContext(StoreContext); if (!value) throw new Error("AppStoreProvider is missing"); return value; }
