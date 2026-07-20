import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnimalSelector } from "@/components/animal/AnimalSelector";
import { HealthScoreCard } from "@/components/animal/HealthScoreCard";
import { RecentActivityItem } from "@/components/medical/RecentActivityItem";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { fetchMedicalEvents } from "@/features/medical/medical.service";
import { useReminderAlerts } from "@/features/reminders/ReminderAlertsProvider";
import { fetchReminders } from "@/features/reminders/reminders.service";
import { useAnimals } from "@/hooks/useAnimals";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useSession } from "@/hooks/useSession";
import { colors, radius, spacing, typography } from "@/theme";
import type { MedicalEvent, Reminder } from "@/types/database.types";
import { formatDate, formatRelativeDueDate } from "@/utils/dates";
import { computeHealthScore } from "@/utils/healthScore";

const actions = [
  { label: "Historique", icon: "history", route: "timeline" },
  { label: "Documents", icon: "file-document-outline", route: "documents" },
  { label: "Partage", icon: "account-multiple-plus-outline", route: "share" },
  { label: "QR Code", icon: "qrcode", route: "qr" },
  { label: "Rappel", icon: "bell-plus-outline", route: "reminders" },
  { label: "Fiche", icon: "card-account-details-outline", route: "fiche" },
] as const;

export default function DashboardScreen() {
  const { profile, user } = useSession();
  const { animals, selectedAnimal, selectedAnimalId, setSelectedAnimalId, refresh } = useAnimals();
  const { activeCount, overdueCount, refresh: refreshReminderAlerts } = useReminderAlerts();
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const loadData = useCallback(async () => {
    if (!selectedAnimalId) return;
    const [nextEvents, nextReminders] = await Promise.all([
      fetchMedicalEvents(selectedAnimalId),
      fetchReminders(selectedAnimalId),
    ]);
    setEvents(nextEvents);
    setReminders(nextReminders);
  }, [selectedAnimalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadData();
      void refreshReminderAlerts();
    }, [loadData, refresh, refreshReminderAlerts]),
  );

  useRealtimeSync(user?.id, loadData);

  const nextReminder = reminders.find((reminder) => reminder.statut === "actif");
  const healthScore = computeHealthScore({
    animal: selectedAnimal,
    events,
    reminders,
  });

  return (
    <Screen style={styles.screen} scroll>
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
        />
      ) : (
        <EmptyState
          icon="paw-outline"
          title="Aucun animal"
          description="Ajoutez votre premier compagnon pour démarrer son carnet de santé."
        />
      )}

      {activeCount > 0 ? (
        <Pressable onPress={() => router.push("/(app)/reminders")}>
          <AppCard style={styles.alert}>
            <View style={styles.alertIcon}>
              <MaterialCommunityIcons name="bell-ring-outline" size={24} color={colors.accent} />
            </View>
            <View style={styles.alertContent}>
              <View style={styles.alertTitleRow}>
                <Text style={styles.alertTitle}>
                  {activeCount} rappel{activeCount > 1 ? "s" : ""} actif
                  {activeCount > 1 ? "s" : ""}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{activeCount}</Text>
                </View>
              </View>
              <Text style={styles.alertText}>
                {overdueCount > 0
                  ? `${overdueCount} en retard — touchez pour ouvrir`
                  : nextReminder
                    ? `Prochain : ${nextReminder.titre} · ${formatRelativeDueDate(nextReminder.date_echeance)} · ${formatDate(nextReminder.date_echeance)}`
                    : "Touchez pour voir la liste"}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </AppCard>
        </Pressable>
      ) : null}

      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            style={styles.action}
            onPress={() => {
              if (action.route === "qr") router.push("/(app)/qr");
              else if (action.route === "reminders") router.push("/(app)/reminders");
              else if (action.route === "fiche" && selectedAnimalId) {
                router.push(`/(app)/animal/${selectedAnimalId}`);
              } else if (selectedAnimalId) {
                router.push({
                  pathname: `/(app)/animal/${action.route}`,
                  params: { id: selectedAnimalId },
                });
              }
            }}
          >
            <View style={styles.actionIcon}>
              <MaterialCommunityIcons name={action.icon} size={26} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <HealthScoreCard score={healthScore} />

      <AppCard>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Activité récente</Text>
            <Text style={styles.sectionHint}>Consultations et événements récents</Text>
          </View>
          {selectedAnimalId ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(app)/animal/timeline",
                  params: { id: selectedAnimalId },
                })
              }
            >
              <Text style={styles.sectionLink}>Voir tout</Text>
            </Pressable>
          ) : null}
        </View>
        {events.slice(0, 5).map((event, index, list) =>
          selectedAnimalId ? (
            <RecentActivityItem
              key={event.id}
              event={event}
              animalId={selectedAnimalId}
              isLast={index === list.length - 1}
            />
          ) : null,
        )}
        {events.length === 0 ? (
          <Text style={styles.empty}>Aucune activité récente pour le moment.</Text>
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
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  alertTitle: {
    ...typography.cardTitle,
    color: colors.text,
    flexShrink: 1,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 12,
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
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  sectionLink: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  empty: {
    color: colors.textMuted,
  },
});
