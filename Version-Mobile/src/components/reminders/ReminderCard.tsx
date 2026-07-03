import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { colors, spacing, typography } from "@/theme";
import type { Reminder } from "@/types/database.types";
import { formatDate, formatRelativeDueDate } from "@/utils/dates";

type ReminderCardProps = {
  reminder: Reminder;
  onComplete?: (reminder: Reminder) => void;
  onCancel?: (reminder: Reminder) => void;
};

export function ReminderCard({ reminder, onComplete, onCancel }: ReminderCardProps) {
  const late = new Date(reminder.date_echeance).getTime() < Date.now();
  const active = reminder.statut === "actif";

  return (
    <AppCard>
      <View style={styles.header}>
        <Text style={styles.title}>{reminder.titre}</Text>
        <Badge
          label={formatRelativeDueDate(reminder.date_echeance)}
          tone={late ? "danger" : "warning"}
        />
      </View>
      <Text style={styles.meta}>
        {reminder.type} • {formatDate(reminder.date_echeance)} • {reminder.canal}
      </Text>
      {!!reminder.notes && <Text style={styles.notes}>{reminder.notes}</Text>}
      {active ? (
        <View style={styles.actions}>
          <Pressable style={[styles.action, styles.done]} onPress={() => onComplete?.(reminder)}>
            <Text style={styles.doneText}>Terminer</Text>
          </Pressable>
          <Pressable style={[styles.action, styles.cancel]} onPress={() => onCancel?.(reminder)}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </View>
      ) : (
        <Badge label={reminder.statut} tone="info" />
      )}
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
  meta: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  notes: {
    color: colors.textMuted,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  done: {
    backgroundColor: colors.successSoft,
  },
  cancel: {
    backgroundColor: colors.surfaceMuted,
  },
  doneText: {
    color: colors.success,
    fontWeight: "900",
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: "900",
  },
});
