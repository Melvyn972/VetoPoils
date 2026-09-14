import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/theme";
import {
  expenseCategoryLabels,
  formatEuro,
  type ExpenseCategory,
} from "@/utils/expenses";

const ORDER: ExpenseCategory[] = [
  "veterinaire",
  "alimentation",
  "accessoires",
  "pharmacie",
  "autre",
];

export function ExpenseChart({ totals }: { totals: Record<ExpenseCategory, number> }) {
  const max = Math.max(...ORDER.map((category) => totals[category] ?? 0), 1);

  return (
    <View style={styles.wrapper}>
      {ORDER.map((category) => {
        const value = totals[category] ?? 0;
        const percent = Math.max(4, (value / max) * 100);
        return (
          <View key={category} style={styles.row}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{expenseCategoryLabels[category]}</Text>
              <Text style={styles.value}>{formatEuro(value)}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${percent}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  value: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 13,
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
