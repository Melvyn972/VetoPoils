import { supabase } from "@/lib/supabase";

export function subscribeToUserNotifications(
  userId: string,
  onChange: () => void,
) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      onChange,
    )
    .subscribe();
}
