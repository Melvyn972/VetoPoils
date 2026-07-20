import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { ReminderCard } from "@/components/reminders/ReminderCard";
import { AppButton } from "@/components/ui/AppButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { useReminderAlerts } from "@/features/reminders/ReminderAlertsProvider";
import { fetchReminders, updateReminderStatus } from "@/features/reminders/reminders.service";
import { colors, spacing, typography } from "@/theme";
import type { Reminder } from "@/types/database.types";
import { getErrorMessage } from "@/utils/errors";

export default function RemindersScreen() {
  const { activeCount, overdueCount, refresh: refreshReminderAlerts } = useReminderAlerts();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const refresh = useCallback(async () => {
    const next = await fetchReminders();
    setReminders(next);
    await refreshReminderAlerts();
  }, [refreshReminderAlerts]);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const changeStatus = async (reminder: Reminder, statut: Reminder["statut"]) => {
    try {
      await updateReminderStatus(reminder.id, statut);
      await refresh();
    } catch (error) {
      Alert.alert("Rappel impossible à modifier", getErrorMessage(error));
    }
  };

  const activeReminders = reminders.filter((reminder) => reminder.statut === "actif");

  return (
    <Screen style={styles.screen}>
      <View>
        <Text style={styles.title}>Rappels</Text>
        <Text style={styles.subtitle}>
          Vaccins, antiparasitaires et rendez-vous à ne plus manquer.
        </Text>
        {activeCount > 0 ? (
          <Text style={styles.counter}>
            {activeCount} actif{activeCount > 1 ? "s" : ""}
            {overdueCount > 0 ? ` · ${overdueCount} en retard` : ""}
          </Text>
        ) : null}
      </View>
      <AppButton
        title="Créer un rappel"
        onPress={() => router.push("/(app)/modals/add-reminder")}
      />
      {reminders.length === 0 ? (
        <EmptyState
          icon="bell-outline"
          title="Aucun rappel actif"
          description="Créez un rappel pour recevoir une notification le jour J."
        />
      ) : (
        <View style={styles.list}>
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onComplete={(item) => changeStatus(item, "termine")}
              onCancel={(item) => changeStatus(item, "annule")}
            />
          ))}
        </View>
      )}
      {activeReminders.length > 0 ? (
        <Text style={styles.hint}>
          Les notifications locales sont planifiées à 9h le jour de l'échéance. Activez-les dans
          Compte si besoin.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 110,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
  },
  counter: {
    marginTop: spacing.sm,
    color: colors.primary,
    fontWeight: "800",
    fontSize: 15,
  },
  list: {
    gap: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
