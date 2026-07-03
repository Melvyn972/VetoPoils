import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

const toneStyles: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.accentSoft, fg: colors.accent },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.infoSoft, fg: colors.info },
  neutral: { bg: colors.surfaceMuted, fg: colors.textMuted },
};

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: BadgeTone;
}) {
  const selected = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: selected.bg }]}>
      <Text style={[styles.label, { color: selected.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
  },
});
