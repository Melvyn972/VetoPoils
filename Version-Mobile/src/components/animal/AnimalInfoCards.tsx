import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { colors, radius, spacing, typography } from "@/theme";
import type { MedicalEvent } from "@/types/database.types";
import { computeAgeLabel, formatShortVisitDate } from "@/utils/dates";

type AnimalInfoCardsProps = {
  dateNaissance?: string | null;
  events: MedicalEvent[];
};

function getLastVisitDate(events: MedicalEvent[]) {
  const visit = events.find(
    (event) =>
      event.vet_token_id ||
      event.type === "consultation" ||
      event.type === "chirurgie",
  );
  return visit?.date_event ?? null;
}

function getLatestWeight(events: MedicalEvent[]) {
  const weightEvent = events.find((event) => event.poids_kg);
  return weightEvent?.poids_kg ?? null;
}

const infoItems = [
  { key: "age", label: "Âge", icon: "cake-variant-outline" as const },
  { key: "weight", label: "Poids", icon: "weight-kilogram" as const },
  { key: "visit", label: "Dernière visite", icon: "calendar-clock-outline" as const },
] as const;

export function AnimalInfoCards({ dateNaissance, events }: AnimalInfoCardsProps) {
  const age = computeAgeLabel(dateNaissance);
  const weight = getLatestWeight(events);
  const lastVisit = getLastVisitDate(events);

  const values: Record<(typeof infoItems)[number]["key"], string> = {
    age: dateNaissance ? age : "-",
    weight: weight ? `${weight} kg` : "-",
    visit: formatShortVisitDate(lastVisit),
  };

  return (
    <AppCard>
      <Text style={styles.title}>Informations</Text>
      <View style={styles.grid}>
        {infoItems.map((item) => (
          <View key={item.key} style={styles.item}>
            <MaterialCommunityIcons name={item.icon} size={28} color={colors.primary} />
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{values[item.key]}</Text>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.heading,
    color: colors.text,
  },
  grid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  item: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  value: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 14,
    textAlign: "center",
  },
});
