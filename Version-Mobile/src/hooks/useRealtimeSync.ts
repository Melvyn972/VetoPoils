import { useEffect } from "react";

import { subscribeToUserNotifications } from "@/lib/realtime";

export function useRealtimeSync(userId?: string | null, onChange?: () => void) {
  useEffect(() => {
    if (!userId || !onChange) return;

    const subscription = subscribeToUserNotifications(userId, onChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [onChange, userId]);
}
