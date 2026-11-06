import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AnimalSelector } from "@/components/animal/AnimalSelector";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Screen } from "@/components/ui/Screen";
import { useReminderAlerts } from "@/features/reminders/ReminderAlertsProvider";
import { createReminder } from "@/features/reminders/reminders.service";
import { useAnimals } from "@/hooks/useAnimals";
import { colors, spacing, typography } from "@/theme";
import type { ReminderType } from "@/types/database.types";
import { formatDateForDatabase, formatLongDate } from "@/utils/dates";
import { getErrorMessage } from "@/utils/errors";

const reminderTypes: { label: string; value: ReminderType }[] = [
  { label: "Vaccin", value: "vaccination" },
  { label: "Antiparasitaire", value: "antiparasitaire" },
  { label: "RDV", value: "rdv" },
  { label: "Autre", value: "autre" },
];

export default function AddReminderScreen() {
  const { animals, selectedAnimalId, setSelectedAnimalId } = useAnimals();
  const { refresh: refreshReminderAlerts } = useReminderAlerts();
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<ReminderType>("vaccination");
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const openDatePicker = () => {
    // Sans ça, iOS affiche "aujourd'hui" dans le spinner mais `date` reste null.
    if (!date) setDate(new Date());
    setShowDatePicker(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "dismissed") return;
    }
    if (selectedDate) setDate(selectedDate);
  };

  const confirmDate = () => {
    if (!date) setDate(new Date());
    setShowDatePicker(false);
  };

  const submit = async () => {
    const dateEcheance = formatDateForDatabase(date);
    if (!selectedAnimalId || !titre.trim() || !dateEcheance) {
      Alert.alert("Rappel incomplet", "Sélectionnez un animal, un titre et une date.");
      return;
    }

    setLoading(true);
    try {
      await createReminder({
        animal_id: selectedAnimalId,
        type,
        titre: titre.trim(),
        date_echeance: dateEcheance,
        canal: "both",
        notes: notes.trim() || null,
      });
      await refreshReminderAlerts();
      router.back();
    } catch (error) {
      Alert.alert("Création impossible", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Nouveau rappel</Text>
        <Text style={styles.subtitle}>Vaccin, traitement ou rendez-vous.</Text>
      </View>
      <AnimalSelector
        animals={animals}
        selectedId={selectedAnimalId}
        onSelect={(animal) => setSelectedAnimalId(animal.id)}
      />
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.chipGrid}>
            {reminderTypes.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setType(option.value)}
                style={[styles.chip, type === option.value && styles.chipSelected]}
              >
                <Text style={[styles.chipText, type === option.value && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <AppInput label="Titre" value={titre} onChangeText={setTitre} placeholder="Vaccin annuel" />
        <View style={styles.field}>
          <Text style={styles.label}>Date d'échéance</Text>
          <Pressable style={styles.dateButton} onPress={openDatePicker}>
            <Text style={[styles.dateText, !date && styles.placeholderText]}>
              {formatLongDate(date)}
            </Text>
          </Pressable>
          {showDatePicker ? (
            <View style={styles.datePickerBlock}>
              <DateTimePicker
                value={date ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={onDateChange}
              />
              {Platform.OS === "ios" ? (
                <AppButton title="Valider la date" variant="secondary" onPress={confirmDate} />
              ) : null}
            </View>
          ) : null}
        </View>
        <AppInput label="Notes" value={notes} onChangeText={setNotes} multiline />
      </View>
      <AppButton title={loading ? "Création..." : "Créer le rappel"} onPress={submit} disabled={loading} />
      <AppButton title="Annuler" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontWeight: "800",
  },
  chipTextSelected: {
    color: colors.white,
  },
  dateButton: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  datePickerBlock: {
    gap: spacing.sm,
  },
  dateText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  placeholderText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
});
