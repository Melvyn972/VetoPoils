import { useCallback, useEffect, useState } from "react";

import { fetchAnimals } from "@/features/animals/animals.service";
import type { Animal } from "@/types/database.types";

export function useAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextAnimals = await fetchAnimals();
      setAnimals(nextAnimals);
      setSelectedAnimalId((current) => current ?? nextAnimals[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedAnimal =
    animals.find((animal) => animal.id === selectedAnimalId) ?? animals[0] ?? null;

  return {
    animals,
    selectedAnimal,
    selectedAnimalId,
    setSelectedAnimalId,
    loading,
    refresh,
  };
}
