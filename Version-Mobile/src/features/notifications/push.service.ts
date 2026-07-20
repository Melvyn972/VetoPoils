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

const REMINDER_NOTIFICATION_PREFIX = "reminder:";

function reminderNotificationId(reminderId: string) {
  return `${REMINDER_NOTIFICATION_PREFIX}${reminderId}`;
}

async function cancelScheduledReminderNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(REMINDER_NOTIFICATION_PREFIX))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

function nextTriggerDate(dateEcheance: string) {
  const dueMorning = new Date(dateEcheance);
  dueMorning.setHours(9, 0, 0, 0);

  if (dueMorning.getTime() > Date.now()) {
    return { date: dueMorning, overdue: false };
  }

  // Déjà passé : rappeler demain matin tant que le rappel reste actif
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return { date: tomorrow, overdue: true };
}

/** Planifie une notif locale pour chaque rappel actif (tous les animaux). */
export async function syncReminderNotifications(
  reminders: Reminder[],
  animalNames: Record<string, string>,
) {
  const enabled = await getPushEnabledLocal();
  if (!enabled) {
    await cancelScheduledReminderNotifications();
    await Notifications.setBadgeCountAsync(0);
    return;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("rappels", {
      name: "Rappels santé",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  await cancelScheduledReminderNotifications();

  const active = reminders.filter((reminder) => reminder.statut === "actif");

  for (const reminder of active) {
    const animalName = animalNames[reminder.animal_id] ?? "Votre animal";
    const { date, overdue } = nextTriggerDate(reminder.date_echeance);

    await Notifications.scheduleNotificationAsync({
      identifier: reminderNotificationId(reminder.id),
      content: {
        title: overdue ? `En retard — ${animalName}` : `Rappel — ${animalName}`,
        body: `${reminder.titre} · ${new Date(reminder.date_echeance).toLocaleDateString("fr-FR")}`,
        sound: true,
        badge: active.length,
        data: { reminderId: reminder.id, animalId: reminder.animal_id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        ...(Platform.OS === "android" ? { channelId: "rappels" } : {}),
      },
    });
  }

  await Notifications.setBadgeCountAsync(active.length);
}

/** @deprecated Utiliser syncReminderNotifications — conserve un alias pour les imports existants. */
export async function scheduleReminderNotifications(
  reminders: Reminder[],
  animalName: string,
) {
  const animalNames = Object.fromEntries(
    reminders.map((reminder) => [reminder.animal_id, animalName]),
  );
  await syncReminderNotifications(reminders, animalNames);
}

export async function checkDueReminders() {
  try {
    await supabase.rpc("notifier_rappels_dus");
  } catch {
    // RPC may not exist yet — local scheduling covers reminders
  }
}
