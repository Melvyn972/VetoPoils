import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_ENABLED_KEY = "vetopoil:notifications_push_enabled";

export async function getPushEnabledLocal(): Promise<boolean> {
  const value = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
  if (value === null) return true;
  return value === "true";
}

export async function setPushEnabledLocal(enabled: boolean) {
  await AsyncStorage.setItem(PUSH_ENABLED_KEY, enabled ? "true" : "false");
}
