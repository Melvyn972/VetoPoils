import { useLocalSearchParams } from "expo-router";

export function useSelectedAnimalId() {
  const params = useLocalSearchParams<{ id?: string }>();
  return params.id;
}
