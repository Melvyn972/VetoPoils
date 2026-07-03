import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnimalSelector } from "@/components/animal/AnimalSelector";
import { HealthScoreCard } from "@/components/animal/HealthScoreCard";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { fetchMedicalEvents } from "@/features/medical/medical.service";
import { fetchReminders } from "@/features/reminders/reminders.service";
import { useAnimals } from "@/hooks/useAnimals";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useSession } from "@/hooks/useSession";
import { colors, radius, spacing, typography } from "@/theme";
import type { MedicalEvent, Reminder } from "@/types/database.types";
import { formatDate, formatRelativeDueDate } from "@/utils/dates";
import { computeHealthScore } from "@/utils/healthScore";

const actions = [
  { label: "Timeline", icon: "timeline-clock-outline", route: "timeline" },
  { label: "Documents", icon: "file-document-outline", route: "documents" },
  { label: "QR Code", icon: "qrcode", route: "qr" },
  { label: "Rappel", icon: "bell-plus-outline", route: "reminders" },
] as const;

export default function DashboardScreen() {
  const { profile, user } = useSession();
  const { animals, selectedAnimal, selectedAnimalId, setSelectedAnimalId, refresh } = useAnimals();
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!selectedAnimalId) return;
    Promise.all([fetchMedicalEvents(selectedAnimalId), fetchReminders(selectedAnimalId)]).then(
      ([nextEvents, nextReminders]) => {
        setEvents(nextEvents);
        setReminders(nextReminders);
      },
    );
  }, [selectedAnimalId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      if (!selectedAnimalId) return;
      Promise.all([fetchMedicalEvents(selectedAnimalId), fetchReminders(selectedAnimalId)]).then(
        ([nextEvents, nextReminders]) => {
          setEvents(nextEvents);
          setReminders(nextReminders);
        },
      );
    }, [refresh, selectedAnimalId]),
  );

  useRealtimeSync(user?.id, () => {
    if (!selectedAnimalId) return;
    fetchMedicalEvents(selectedAnimalId).then(setEvents);
  });

  const nextReminder = reminders.find((reminder) => reminder.statut === "actif");
  const healthScore = computeHealthScore({
    animal: selectedAnimal,
    events,
    reminders,
  });

  return (
    <Screen
      style={styles.screen}
      scroll
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour {profile?.prenom ?? ""}</Text>
          <Text style={styles.subtitle}>Votre espace santé animal</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.prenom?.slice(0, 1) ?? "V"}</Text>
        </View>
      </View>

      {animals.length > 0 ? (
        <AnimalSelector
          animals={animals}
          selectedId={selectedAnimalId}
          onSelect={(animal) => setSelectedAnimalId(animal.id)}
          onItemPress={(animal) => router.push(`/(app)/animal/${animal.id}`)}
        />
      ) : (
        <EmptyState
          icon="paw-outline"
          title="Aucun animal"
          description="Ajoutez votre premier compagnon pour démarrer son carnet de santé."
        />
      )}

      {nextReminder ? (
        <AppCard style={styles.alert}>
          <View style={styles.alertIcon}>
            <MaterialCommunityIcons name="bell-ring-outline" size={24} color={colors.accent} />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{nextReminder.titre}</Text>
            <Text style={styles.alertText}>
              {formatRelativeDueDate(nextReminder.date_echeance)} •{" "}
              {formatDate(nextReminder.date_echeance)}
            </Text>
          </View>
        </AppCard>
      ) : null}

      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            style={styles.action}
            onPress={() => {
              if (action.route === "qr") router.push("/(app)/qr");
              else if (action.route === "reminders") router.push("/(app)/reminders");
              else if (selectedAnimalId) {
                router.push({
                  pathname: `/(app)/animal/${action.route}`,
                  params: { id: selectedAnimalId },
                });
              }
            }}
          >
            <View style={styles.actionIcon}>
              <MaterialCommunityIcons
                name={action.icon}
                size={26}
                color={colors.primary}
              />
            </View>
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <HealthScoreCard score={healthScore} />

      <AppCard>
        <Text style={styles.sectionTitle}>Activité récente</Text>
        {events.slice(0, 3).map((event) => (
          <View key={event.id} style={styles.activity}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{event.titre ?? event.type}</Text>
              <Text style={styles.activityDate}>{formatDate(event.date_event)}</Text>
            </View>
          </View>
        ))}
        {events.length === 0 ? (
          <Text style={styles.empty}>Aucun événement médical pour le moment.</Text>
        ) : null}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 20,
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentSoft,
  },
  alertIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...typography.cardTitle,
    color: colors.text,
  },
  alertText: {
    color: colors.textMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  action: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontWeight: "800",
    color: colors.text,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  activity: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: "800",
    color: colors.text,
  },
  activityDate: {
    color: colors.textMuted,
  },
  empty: {
    color: colors.textMuted,
  },
});
