import { useCallback, useEffect, useState } from "react";

import { fetchAnimalAccess } from "@/features/sharing/sharing.service";
import { useSession } from "@/hooks/useSession";
import type { AnimalAccess } from "@/types/database.types";

const defaultAccess: AnimalAccess = {
  level: "read_only",
  isOwner: false,
  canWrite: false,
  canWriteDailyLog: false,
  canManageShares: false,
};

export function useAnimalAccess(animalId?: string | null) {
  const { user } = useSession();
  const [access, setAccess] = useState<AnimalAccess>(defaultAccess);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!animalId || !user?.id) {
      setAccess(defaultAccess);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setAccess(await fetchAnimalAccess(animalId, user.id));
    } catch {
      setAccess(defaultAccess);
    } finally {
      setLoading(false);
    }
  }, [animalId, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { access, loading, refresh };
}
