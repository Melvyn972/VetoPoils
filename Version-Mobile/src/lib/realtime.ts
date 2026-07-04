import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type Listener = () => void;

type ChannelEntry = {
  channel: RealtimeChannel;
  listeners: Set<Listener>;
};

const notificationChannels = new Map<string, ChannelEntry>();

function ensureNotificationChannel(userId: string): ChannelEntry {
  const existing = notificationChannels.get(userId);
  if (existing) return existing;

  const listeners = new Set<Listener>();
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        listeners.forEach((listener) => {
          try {
            listener();
          } catch (error) {
            console.warn("Notification listener failed", error);
          }
        });
      },
    )
    .subscribe();

  const entry = { channel, listeners };
  notificationChannels.set(userId, entry);
  return entry;
}

export function subscribeToUserNotifications(userId: string, onChange: Listener) {
  const entry = ensureNotificationChannel(userId);
  entry.listeners.add(onChange);

  return {
    unsubscribe: () => {
      entry.listeners.delete(onChange);
      if (entry.listeners.size === 0) {
        void supabase.removeChannel(entry.channel);
        notificationChannels.delete(userId);
      }
    },
  };
}
