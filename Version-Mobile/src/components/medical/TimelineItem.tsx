import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { colors, spacing, typography } from "@/theme";
import type { MedicalEvent } from "@/types/database.types";
import { formatDate } from "@/utils/dates";

const typeLabels: Record<MedicalEvent["type"], string> = {
  consultation: "Consultation",
  vaccination: "Vaccin",
  chirurgie: "Chirurgie",
  ordonnance: "Ordonnance",
  analyse: "Analyse",
  autre: "Autre",
};

export function TimelineItem({ event }: { event: MedicalEvent }) {
  return (
    <View style={styles.row}>
      <View style={styles.line}>
        <View style={styles.dot} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{event.titre ?? typeLabels[event.type]}</Text>
          <Badge
            label={event.status === "pending" ? "À valider" : typeLabels[event.type]}
            tone={event.status === "pending" ? "warning" : "info"}
          />
        </View>
        <Text style={styles.date}>{formatDate(event.date_event)}</Text>
        {!!event.description && <Text style={styles.description}>{event.description}</Text>}
        {!!event.diagnostic && <Text style={styles.description}>{event.diagnostic}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  line: {
    alignItems: "center",
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  content: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
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
