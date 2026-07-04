import { useEffect } from "react";

import { fetchNotifications } from "@/features/notifications/notifications.service";
import {
  checkDueReminders,
  handleAppNotification,
  registerPushToken,
} from "@/features/notifications/push.service";
import { getPushEnabledLocal } from "@/features/settings/preferences.service";
import { subscribeToUserNotifications } from "@/lib/realtime";

export function useNotificationSetup(userId?: string | null) {
  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    (async () => {
      const enabled = await getPushEnabledLocal();
      if (enabled && mounted) {
        await registerPushToken(userId);
        await checkDueReminders();
      }
    })();

    const subscription = subscribeToUserNotifications(userId, async () => {
      const notifications = await fetchNotifications();
      const latest = notifications[0];
      if (latest && !latest.lu_le) {
        await handleAppNotification(latest);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [userId]);
}
