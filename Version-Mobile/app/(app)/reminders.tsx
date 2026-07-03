import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { ReminderCard } from "@/components/reminders/ReminderCard";
import { AppButton } from "@/components/ui/AppButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { fetchReminders, updateReminderStatus } from "@/features/reminders/reminders.service";
import { colors, spacing, typography } from "@/theme";
import type { Reminder } from "@/types/database.types";
import { getErrorMessage } from "@/utils/errors";

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const refresh = useCallback(() => {
    fetchReminders().then(setReminders);
  }, []);

  useEffect(refresh, [refresh]);
  useFocusEffect(refresh);

  const changeStatus = async (reminder: Reminder, statut: Reminder["statut"]) => {
    try {
      await updateReminderStatus(reminder.id, statut);
      refresh();
    } catch (error) {
      Alert.alert("Rappel impossible à modifier", getErrorMessage(error));
    }
  };

  return (
    <Screen style={styles.screen}>
      <View>
        <Text style={styles.title}>Rappels</Text>
        <Text style={styles.subtitle}>
          Vaccins, antiparasitaires et rendez-vous à ne plus manquer.
        </Text>
      </View>
      <AppButton
        title="Créer un rappel"
        onPress={() => router.push("/(app)/modals/add-reminder")}
      />
      {reminders.length === 0 ? (
        <EmptyState
          icon="bell-outline"
          title="Aucun rappel actif"
          description="Créez un rappel pour recevoir une alerte au bon moment."
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
  list: {
    gap: spacing.md,
  },
});
