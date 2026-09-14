import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Animal, MedicalEvent, Reminder } from "@/types/database.types";
import { computeHealthScore, type HealthScoreResult } from "@/utils/healthScore";

import { persistHealthScore } from "./healthScore.service";

export function useHealthScore(params: {
  animal?: Animal | null;
  events: MedicalEvent[];
  reminders: Reminder[];
  canPersist?: boolean;
  onPersisted?: (result: HealthScoreResult) => void;
}) {
  const result = useMemo(
    () =>
      computeHealthScore({
        animal: params.animal,
        events: params.events,
        reminders: params.reminders,
      }),
    [params.animal, params.events, params.reminders],
  );

  const [saving, setSaving] = useState(false);
  const lastPersisted = useRef<number | null>(params.animal?.score_sante ?? null);
  const onPersistedRef = useRef(params.onPersisted);
  onPersistedRef.current = params.onPersisted;

  const persist = useCallback(
    async (force = false) => {
      if (!params.animal || !result || !params.canPersist) return;

      if (!force && lastPersisted.current === result.score && params.animal.score_sante === result.score) {
        return;
      }

      setSaving(true);
      try {
        await persistHealthScore(params.animal.id, result);
        lastPersisted.current = result.score;
        onPersistedRef.current?.(result);
      } catch {
        // Lecture seule ou RLS : le score reste calculé localement.
      } finally {
        setSaving(false);
      }
    },
    [params.animal, params.canPersist, result],
  );

  useEffect(() => {
    void persist(false);
  }, [persist]);

  return { result, saving, refresh: () => persist(true) };
}
