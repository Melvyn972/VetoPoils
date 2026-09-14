import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Screen } from "@/components/ui/Screen";
import { createMedicalEvent } from "@/features/medical/medical.service";
import { colors, spacing, typography } from "@/theme";
import type { MedicalEventType } from "@/types/database.types";
import { dateInputToIso } from "@/utils/dates";
import { getErrorMessage } from "@/utils/errors";
import { medicalEventTypeLabels } from "@/utils/medicalLabels";

const EVENT_TYPES = Object.entries(medicalEventTypeLabels) as Array<[MedicalEventType, string]>;

function asEventType(value?: string): MedicalEventType {
  if (EVENT_TYPES.some(([type]) => type === value)) {
    return value as MedicalEventType;
  }
  return "consultation";
}

export default function AddMedicalEventScreen() {
  const params = useLocalSearchParams<{
    id: string;
    type?: string;
    titre?: string;
    description?: string;
    diagnostic?: string;
    traitement?: string;
    poids?: string;
    date_event?: string;
  }>();
  const [type, setType] = useState<MedicalEventType>(asEventType(params.type));
  const [titre, setTitre] = useState(params.titre ?? "");
  const [description, setDescription] = useState(params.description ?? "");
  const [diagnostic, setDiagnostic] = useState(params.diagnostic ?? "");
  const [traitement, setTraitement] = useState(params.traitement ?? params.description ?? "");
  const [weight, setWeight] = useState(params.poids ?? "");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!params.id) {
      Alert.alert("Événement incomplet", "Animal introuvable.");
      return;
    }

    const resolvedTitle = titre.trim() || medicalEventTypeLabels[type];
    const weightValue = weight.trim() ? Number(weight.replace(",", ".")) : undefined;
    if (weight.trim() && (!weightValue || Number.isNaN(weightValue) || weightValue <= 0)) {
      Alert.alert("Poids invalide", "Saisissez un poids positif, ou laissez le champ vide.");
      return;
    }

    setLoading(true);
    try {
      await createMedicalEvent({
        animal_id: params.id,
        type,
        titre: resolvedTitle,
        description: description.trim() || undefined,
        diagnostic: diagnostic.trim() || undefined,
        traitement: traitement.trim() || undefined,
        poids_kg: weightValue,
        date_event: dateInputToIso(params.date_event) ?? undefined,
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
        <Text style={styles.subtitle}>Choisissez le type d’événement médical, puis complétez les champs utiles.</Text>
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
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.typeChip, selected && styles.typeChipSelected]}
              >
                <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>{label}</Text>
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
        <AppInput
          label="Poids (kg)"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
          placeholder="Optionnel"
        />
        <AppInput
          label="Diagnostic / objet"
          value={diagnostic}
          onChangeText={setDiagnostic}
          placeholder="Optionnel"
        />
        <AppInput
          label="Traitement"
          value={traitement}
          onChangeText={setTraitement}
          placeholder="Optionnel"
        />
        <AppInput label="Notes" value={description} onChangeText={setDescription} multiline placeholder="Optionnel" />
      </View>
      <AppButton title={loading ? "Enregistrement..." : "Ajouter"} onPress={() => void submit()} disabled={loading} />
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
