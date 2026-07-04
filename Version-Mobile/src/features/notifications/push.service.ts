import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";
import type { AppNotification, Reminder } from "@/types/database.types";

import { getPushEnabledLocal } from "../settings/preferences.service";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function registerPushToken(userId: string) {
  const enabled = await getPushEnabledLocal();
  if (!enabled) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Vet'OPoil",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    if (Constants.appOwnership === "expo") return;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await supabase
      .from("profiles")
      .update({ expo_push_token: tokenData.data })
      .eq("id", userId);
  } catch {
    // Expo push token unavailable in Expo Go — local notifications still work
  }
}

export async function syncPushPreference(userId: string, enabled: boolean) {
  await supabase.from("profiles").update({ notifications_push_enabled: enabled }).eq("id", userId);
  if (enabled) {
    await registerPushToken(userId);
  } else {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await supabase.from("profiles").update({ expo_push_token: null }).eq("id", userId);
  }
}

export async function showLocalNotification(title: string, body: string) {
  const enabled = await getPushEnabledLocal();
  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

export async function handleAppNotification(notification: AppNotification) {
  await showLocalNotification(notification.titre, notification.corps);
}

export async function scheduleReminderNotifications(reminders: Reminder[], animalName: string) {
  const enabled = await getPushEnabledLocal();
  if (!enabled) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  for (const reminder of reminders) {
    if (reminder.statut !== "actif") continue;

    const due = new Date(reminder.date_echeance);
    due.setHours(9, 0, 0, 0);
    if (due.getTime() <= Date.now()) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Rappel — ${animalName}`,
        body: `${reminder.titre} · ${due.toLocaleDateString("fr-FR")}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: due,
      },
    });
  }
}

export async function checkDueReminders() {
  try {
    await supabase.rpc("notifier_rappels_dus");
  } catch {
    // RPC may not exist yet — local scheduling covers reminders
  }
}
