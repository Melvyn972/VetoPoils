import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Screen } from "@/components/ui/Screen";
import { createMedicalEvent } from "@/features/medical/medical.service";
import { colors, spacing, typography } from "@/theme";
import type { MedicalEventType } from "@/types/database.types";
import { medicalEventTypeLabels } from "@/utils/medicalLabels";
import { getErrorMessage } from "@/utils/errors";

const EVENT_TYPES = Object.entries(medicalEventTypeLabels) as Array<[MedicalEventType, string]>;

export default function AddMedicalEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [type, setType] = useState<MedicalEventType>("consultation");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!id) {
      Alert.alert("Événement incomplet", "Animal introuvable.");
      return;
    }

    const resolvedTitle = titre.trim() || medicalEventTypeLabels[type];

    setLoading(true);
    try {
      await createMedicalEvent({
        animal_id: id,
        type,
        titre: resolvedTitle,
        description: description.trim() || undefined,
        poids_kg: weight ? Number(weight.replace(",", ".")) : undefined,
      });
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
        <Text style={styles.title}>Ajouter un événement</Text>
        <Text style={styles.subtitle}>Choisissez le type d’événement médical.</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeGrid}>
          {EVENT_TYPES.map(([value, label]) => {
            const selected = type === value;
            return (
              <Pressable
                key={value}
                onPress={() => setType(value)}
                style={[styles.typeChip, selected && styles.typeChipSelected]}
              >
                <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <AppInput
          label="Titre (optionnel)"
          value={titre}
          onChangeText={setTitre}
          placeholder={medicalEventTypeLabels[type]}
        />
        <AppInput label="Poids (kg)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
        <AppInput label="Description" value={description} onChangeText={setDescription} multiline />
      </View>
      <AppButton title={loading ? "Enregistrement..." : "Ajouter"} onPress={submit} disabled={loading} />
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
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  typeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  typeChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  typeChipTextSelected: {
    color: colors.primary,
  },
});
