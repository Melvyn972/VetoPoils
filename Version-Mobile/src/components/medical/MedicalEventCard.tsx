import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { colors, spacing, typography } from "@/theme";
import type { MedicalEvent } from "@/types/database.types";
import { formatDate } from "@/utils/dates";

export function MedicalEventCard({
  event,
  onValidate,
}: {
  event: MedicalEvent;
  onValidate?: () => void;
}) {
  return (
    <AppCard>
      <View style={styles.header}>
        <Text style={styles.title}>{event.titre ?? event.type}</Text>
        <Badge
          label={event.status === "pending" ? "À valider" : "Validé"}
          tone={event.status === "pending" ? "warning" : "success"}
        />
      </View>
      <Text style={styles.date}>{formatDate(event.date_event)}</Text>
      {!!event.description && <Text style={styles.description}>{event.description}</Text>}
      {!!event.traitement && <Text style={styles.description}>Traitement : {event.traitement}</Text>}
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
  title: {
    ...typography.cardTitle,
    flex: 1,
    color: colors.text,
  },
  date: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  description: {
    color: colors.textMuted,
  },
});
