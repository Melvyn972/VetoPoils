import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { colors, spacing, typography } from "@/theme";
import type { MedicalEvent } from "@/types/database.types";
import { formatDate } from "@/utils/dates";
import { getMedicalEventSummary, getMedicalEventTypeLabel } from "@/utils/medicalLabels";

export function MedicalEventCard({
  event,
  onValidate,
}: {
  event: MedicalEvent;
  onValidate?: () => void;
}) {
  const summary = getMedicalEventSummary(event);
  const typeLabel = getMedicalEventTypeLabel(event.type);

  return (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{event.titre ?? typeLabel}</Text>
          <Text style={styles.type}>{typeLabel}</Text>
        </View>
        <View style={styles.badges}>
          {event.vet_token_id ? <Badge label="Vétérinaire" tone="info" /> : null}
          <Badge
            label={event.status === "pending" ? "À valider" : "Validé"}
            tone={event.status === "pending" ? "warning" : "success"}
          />
        </View>
      </View>

      <Text style={styles.date}>{formatDate(event.date_event)}</Text>

      {!!event.diagnostic && (
        <View style={styles.block}>
          <Text style={styles.label}>Diagnostic</Text>
          <Text style={styles.value}>{event.diagnostic}</Text>
        </View>
      )}

      {!!event.description && (
        <View style={styles.block}>
          <Text style={styles.label}>Détails</Text>
          <Text style={styles.value}>{event.description}</Text>
        </View>
      )}

      {!!event.traitement && (
        <View style={styles.block}>
          <Text style={styles.label}>Traitement</Text>
          <Text style={styles.value}>{event.traitement}</Text>
        </View>
      )}

      {event.poids_kg != null && (
        <View style={styles.block}>
          <Text style={styles.label}>Poids</Text>
          <Text style={styles.value}>{event.poids_kg} kg</Text>
        </View>
      )}

      {!event.diagnostic && !event.description && !event.traitement && event.poids_kg == null && !!summary ? (
        <Text style={styles.value}>{summary}</Text>
      ) : null}

      {event.status === "pending" && onValidate ? (
        <AppButton title="Valider l'événement" onPress={onValidate} />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.cardTitle,
    color: colors.text,
  },
  type: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  badges: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  date: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  block: {
    gap: 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    color: colors.text,
    lineHeight: 22,
  },
});
