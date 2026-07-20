import * as Notifications from "expo-notifications";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";

import { fetchAnimals } from "@/features/animals/animals.service";
import { syncReminderNotifications } from "@/features/notifications/push.service";
import { fetchReminders } from "@/features/reminders/reminders.service";
import type { Reminder } from "@/types/database.types";

type ReminderAlertsContextValue = {
  activeCount: number;
  overdueCount: number;
  activeReminders: Reminder[];
  refresh: () => Promise<void>;
};

const ReminderAlertsContext = createContext<ReminderAlertsContextValue | undefined>(
  undefined,
);

function isOverdue(reminder: Reminder) {
  const due = new Date(reminder.date_echeance);
  due.setHours(23, 59, 59, 999);
  return due.getTime() < Date.now();
}

export function ReminderAlertsProvider({ children }: PropsWithChildren) {
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [reminders, animals] = await Promise.all([fetchReminders(), fetchAnimals()]);
      const active = reminders.filter((reminder) => reminder.statut === "actif");
      setActiveReminders(active);

      const animalNames = Object.fromEntries(animals.map((animal) => [animal.id, animal.nom]));
      await syncReminderNotifications(active, animalNames);
      await Notifications.setBadgeCountAsync(active.length);
    } catch {
      // Supabase / permissions peuvent être indisponibles — le compteur local reste utile
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const value = useMemo<ReminderAlertsContextValue>(() => {
    const overdueCount = activeReminders.filter(isOverdue).length;
    return {
      activeCount: activeReminders.length,
      overdueCount,
      activeReminders,
      refresh,
    };
  }, [activeReminders, refresh]);

  return (
    <ReminderAlertsContext.Provider value={value}>{children}</ReminderAlertsContext.Provider>
  );
}

export function useReminderAlerts() {
  const context = useContext(ReminderAlertsContext);
  if (!context) {
    throw new Error("useReminderAlerts must be used inside ReminderAlertsProvider");
  }
  return context;
}
