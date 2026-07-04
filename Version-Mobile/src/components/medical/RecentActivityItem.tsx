import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { colors, radius, spacing, typography } from "@/theme";
import type { MedicalEvent } from "@/types/database.types";
import { formatDate } from "@/utils/dates";
import { getMedicalEventSummary, getMedicalEventTypeLabel } from "@/utils/medicalLabels";

const typeIcons: Record<MedicalEvent["type"], keyof typeof MaterialCommunityIcons.glyphMap> = {
  consultation: "stethoscope",
  vaccination: "needle",
  chirurgie: "hospital-box-outline",
  ordonnance: "pill",
  analyse: "test-tube",
  autre: "clipboard-text-outline",
};

export function RecentActivityItem({
  event,
  animalId,
  isLast,
}: {
  event: MedicalEvent;
  animalId: string;
  isLast?: boolean;
}) {
  const typeLabel = getMedicalEventTypeLabel(event.type);
  const summary = getMedicalEventSummary(event);

  return (
    <Pressable
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={() =>
        router.push({
          pathname: "/(app)/modals/consultation-detail",
          params: { eventId: event.id, animalId },
        })
      }
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={typeIcons[event.type] ?? "clipboard-text-outline"}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {event.titre ?? typeLabel}
          </Text>
          {event.status === "pending" ? <Badge label="À valider" tone="warning" /> : null}
        </View>
        <Text style={styles.meta}>
          {typeLabel}
          {event.vet_token_id ? " · Vétérinaire" : ""}
        </Text>
        <Text style={styles.date}>{formatDate(event.date_event)}</Text>
        {!!summary && (
          <Text style={styles.summary} numberOfLines={2}>
            {summary}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontWeight: "800",
    color: colors.text,
    fontSize: 15,
  },
  meta: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  summary: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
