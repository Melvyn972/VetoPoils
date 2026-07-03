import { useEffect } from "react";

import { subscribeToUserNotifications } from "@/lib/realtime";

export function useRealtimeSync(userId?: string | null, onChange?: () => void) {
  useEffect(() => {
    if (!userId || !onChange) return;

    const channel = subscribeToUserNotifications(userId, onChange);

    return () => {
      channel.unsubscribe();
    };
  }, [onChange, userId]);
}
