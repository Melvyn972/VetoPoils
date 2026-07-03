import { supabase } from "@/lib/supabase";

export async function fetchNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function markNotificationAsRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ lu_le: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
