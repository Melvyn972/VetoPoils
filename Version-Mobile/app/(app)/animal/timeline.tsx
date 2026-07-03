import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { MedicalEventCard } from "@/components/medical/MedicalEventCard";
import { AppButton } from "@/components/ui/AppButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Screen } from "@/components/ui/Screen";
import {
  fetchMedicalEvents,
  validateMedicalEvent,
} from "@/features/medical/medical.service";
import type { MedicalEventFilter } from "@/features/medical/medical.types";
import { colors, spacing, typography } from "@/theme";
import type { MedicalEvent } from "@/types/database.types";
import { getErrorMessage } from "@/utils/errors";

const filters = [
  { label: "Tout", value: "all" },
  { label: "À valider", value: "pending" },
  { label: "Consultations", value: "consultation" },
  { label: "Vaccins", value: "vaccination" },
  { label: "Analyses", value: "analyse" },
  { label: "Chirurgies", value: "chirurgie" },
  { label: "Ordonnances", value: "ordonnance" },
  { label: "Autres", value: "autre" },
] satisfies { label: string; value: MedicalEventFilter }[];

export default function TimelineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [filter, setFilter] = useState<MedicalEventFilter>("all");

  const refresh = async () => {
    if (!id) return;
    setEvents(await fetchMedicalEvents(id));
  };

  useEffect(() => {
    refresh();
  }, [id]);

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "pending") return events.filter((event) => event.status === "pending");
    return events.filter((event) => event.type === filter);
  }, [events, filter]);

  const validate = async (eventId: string) => {
    try {
      await validateMedicalEvent(eventId);
      await refresh();
    } catch (error) {
      Alert.alert("Validation impossible", getErrorMessage(error));
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline médicale</Text>
        <Text style={styles.subtitle}>Historique chronologique du dossier santé.</Text>
      </View>
      <FilterChips options={filters} value={filter} onChange={setFilter} />
      <AppButton
        title="Ajouter un événement"
        variant="secondary"
        onPress={() => router.push({ pathname: "/(app)/modals/add-medical-event", params: { id } })}
      />
      {filtered.length === 0 ? (
        <EmptyState
          icon="timeline-outline"
          title="Aucun événement"
          description="Ajoutez une consultation, un vaccin ou une analyse pour alimenter la timeline."
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((event) => (
            <MedicalEventCard
              key={event.id}
              event={event}
              onValidate={event.status === "pending" ? () => validate(event.id) : undefined}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 110,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
  },
  list: {
    gap: spacing.md,
  },
});
