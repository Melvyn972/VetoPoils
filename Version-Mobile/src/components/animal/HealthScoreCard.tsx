import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { colors, radius, spacing, typography } from "@/theme";
import type { HealthScoreResult } from "@/utils/healthScore";

const TREND_LABELS = {
  hausse: "Poids en hausse",
  baisse: "Poids en baisse",
  stable: "Poids stable",
  inconnu: "Courbe de poids insuffisante",
} as const;

export function HealthScoreCard({
  result,
  saving,
  onRefresh,
}: {
  result?: HealthScoreResult | null;
  saving?: boolean;
  onRefresh?: () => void;
}) {
  const value = result?.score ?? null;
  const factors = result?.details.factors ?? [];

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.label}>Score santé</Text>
          <Text style={styles.score}>{value === null ? "À calculer" : `${value}/100`}</Text>
        </View>
        {onRefresh ? (
          <Pressable
            onPress={onRefresh}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Actualiser le score santé"
            style={styles.refresh}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={saving ? colors.textMuted : colors.primary}
            />
            <Text style={styles.refreshText}>{saving ? "Calcul..." : "Actualiser"}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.track} accessibilityLabel={value === null ? "Score indisponible" : `Score ${value} sur 100`}>
        <View style={[styles.progress, { width: `${value ?? 0}%` }]} />
      </View>
      <Text style={styles.helper}>
        {value === null
          ? "Ajoutez des rappels et événements médicaux pour calculer le score."
          : `${TREND_LABELS[result?.details.weightTrend ?? "inconnu"]}. Basé sur le poids, les vaccins, les rappels et la fréquence des consultations.`}
      </Text>
      {factors.length > 0 ? (
        <View style={styles.factors}>
          {factors.slice(0, 4).map((factor) => (
            <View key={factor.code} style={styles.factor}>
              <Text style={styles.factorLabel}>{factor.label}</Text>
              <Text style={[styles.factorDelta, factor.delta < 0 ? styles.negative : styles.positive]}>
                {factor.delta > 0 ? `+${factor.delta}` : factor.delta}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  score: {
    ...typography.title,
    color: colors.primaryDark,
  },
  refresh: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  refreshText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 12,
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  factors: {
    gap: spacing.sm,
  },
  factor: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  factorLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  factorDelta: {
    fontWeight: "800",
    fontSize: 13,
  },
  negative: {
    color: colors.danger,
  },
  positive: {
    color: colors.success,
  },
});
