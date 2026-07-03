import { StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { colors, radius, spacing, typography } from "@/theme";

export function HealthScoreCard({ score }: { score?: number | null }) {
  const value = score ?? null;

  return (
    <AppCard style={styles.card}>
      <View>
        <Text style={styles.label}>Score santé</Text>
        <Text style={styles.score}>{value === null ? "À calculer" : `${value}/100`}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${value ?? 0}%` }]} />
      </View>
      <Text style={styles.helper}>
        {value === null
          ? "Ajoutez des rappels et événements médicaux pour calculer le score."
          : "Basé sur les rappels, la timeline et les informations du profil."}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  score: {
    ...typography.title,
    color: colors.primaryDark,
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
  },
});
