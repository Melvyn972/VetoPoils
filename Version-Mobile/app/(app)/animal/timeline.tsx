import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { ConsultationHistoryCard } from "@/components/medical/ConsultationHistoryCard";
import { AppButton } from "@/components/ui/AppButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Screen } from "@/components/ui/Screen";
import { fetchDocumentsByEventIds } from "@/features/documents/documents.service";
import {
  fetchMedicalEvents,
  validateMedicalEvent,
} from "@/features/medical/medical.service";
import type { MedicalEventFilter } from "@/features/medical/medical.types";
import { colors, spacing, typography } from "@/theme";
import type { Document, MedicalEvent } from "@/types/database.types";
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
  const [documentsByEvent, setDocumentsByEvent] = useState<Record<string, Document[]>>({});
  const [filter, setFilter] = useState<MedicalEventFilter>("all");

  const refresh = async () => {
    if (!id) return;
    const nextEvents = await fetchMedicalEvents(id);
    setEvents(nextEvents);
    const docs = await fetchDocumentsByEventIds(nextEvents.map((event) => event.id));
    setDocumentsByEvent(docs);
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
    <Screen style={styles.screen} scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Historique de consultation</Text>
        <Text style={styles.subtitle}>
          Retrouvez chaque consultation avec ses documents et détails cliniques.
        </Text>
      </View>
      <FilterChips options={filters} value={filter} onChange={setFilter} />
      <AppButton
        title="Ajouter une consultation"
        variant="secondary"
        onPress={() => router.push({ pathname: "/(app)/modals/add-medical-event", params: { id } })}
      />
      {filtered.length === 0 ? (
        <EmptyState
          icon="history"
          title="Aucune consultation"
          description="Ajoutez une consultation ou attendez qu'un vétérinaire en rédige une via le QR code."
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((event, index) => (
            <ConsultationHistoryCard
              key={event.id}
              event={event}
              documents={documentsByEvent[event.id] ?? []}
              onValidate={event.status === "pending" ? () => validate(event.id) : undefined}
              isLast={index === filtered.length - 1}
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
    lineHeight: 20,
  },
  list: {
    gap: spacing.sm,
  },
});
