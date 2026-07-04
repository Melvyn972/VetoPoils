import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnimalAvatar } from "@/components/animal/AnimalAvatar";
import { AnimalInfoCards } from "@/components/animal/AnimalInfoCards";
import { HealthScoreCard } from "@/components/animal/HealthScoreCard";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { Screen } from "@/components/ui/Screen";
import { fetchAnimal } from "@/features/animals/animals.service";
import { fetchMedicalEvents } from "@/features/medical/medical.service";
import { fetchReminders } from "@/features/reminders/reminders.service";
import { colors, radius, spacing, typography } from "@/theme";
import type { Animal, MedicalEvent, Reminder } from "@/types/database.types";
import { computeHealthScore } from "@/utils/healthScore";

const links = [
  { label: "Historique de consultation", icon: "history", route: "timeline" },
  { label: "Documents", icon: "file-document-outline", route: "documents" },
  { label: "Partage", icon: "account-multiple-plus-outline", route: "share" },
] as const;

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const refresh = useCallback(() => {
    if (!id) return;
    fetchAnimal(id).then(setAnimal);
    Promise.all([fetchMedicalEvents(id), fetchReminders(id)]).then(
      ([nextEvents, nextReminders]) => {
        setEvents(nextEvents);
        setReminders(nextReminders);
      },
    );
  }, [id]);

  useEffect(refresh, [refresh]);
  useFocusEffect(refresh);

  if (!animal) {
    return (
      <Screen>
        <Text style={styles.subtitle}>Chargement de la fiche...</Text>
      </Screen>
    );
  }

  const healthScore = computeHealthScore({ animal, events, reminders });

  return (
    <Screen style={styles.screen}>
      <AppCard style={styles.hero}>
        <AnimalAvatar animal={animal} size={92} />
        <Text style={styles.name}>{animal.nom}</Text>
        <Text style={styles.meta}>
          {animal.espece}
          {animal.race ? ` • ${animal.race}` : ""}
        </Text>
        <Badge label={animal.puce ? "Puce renseignée" : "Puce à compléter"} tone="info" />
      </AppCard>

      <Pressable
        style={styles.editButton}
        onPress={() => router.push({ pathname: "/(app)/animal/edit", params: { id: animal.id } })}
      >
        <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
        <Text style={styles.editText}>Modifier la fiche</Text>
      </Pressable>

      <AnimalInfoCards dateNaissance={animal.date_naissance} events={events} />

      <AppCard>
        <Text style={styles.metricLabel}>Sexe</Text>
        <Text style={styles.metricValue}>{animal.sexe}</Text>
        <Text style={styles.metricLabel}>Couleur</Text>
        <Text style={styles.metricValue}>{animal.couleur ?? "Non renseignée"}</Text>
        <Text style={styles.metricLabel}>Numéro de puce</Text>
        <Text style={styles.metricValue}>{animal.puce ?? "Optionnel / non renseigné"}</Text>
      </AppCard>

      <HealthScoreCard score={healthScore} />

      <View style={styles.links}>
        {links.map((link) => (
          <Pressable
            key={link.route}
            style={styles.link}
            onPress={() =>
              router.push({
                pathname: `/(app)/animal/${link.route}`,
                params: { id: animal.id },
              })
            }
          >
            <View style={styles.linkIcon}>
              <MaterialCommunityIcons name={link.icon} size={24} color={colors.primary} />
            </View>
            <Text style={styles.linkText}>{link.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 110,
  },
  hero: {
    alignItems: "center",
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  meta: {
    color: colors.textMuted,
  },
  subtitle: {
    color: colors.textMuted,
  },
  metricLabel: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.text,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  links: {
    gap: spacing.md,
  },
  editButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    padding: spacing.md,
  },
  editText: {
    color: colors.primary,
    fontWeight: "900",
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    flex: 1,
    color: colors.text,
    fontWeight: "900",
  },
});
