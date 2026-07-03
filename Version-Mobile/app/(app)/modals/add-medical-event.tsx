import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Screen } from "@/components/ui/Screen";
import { createMedicalEvent } from "@/features/medical/medical.service";
import { colors, spacing, typography } from "@/theme";
import { getErrorMessage } from "@/utils/errors";

export default function AddMedicalEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!id || !titre.trim()) {
      Alert.alert("Événement incomplet", "Le titre est obligatoire.");
      return;
    }

    setLoading(true);
    try {
      await createMedicalEvent({
        animal_id: id,
        type: "consultation",
        titre: titre.trim(),
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
        <Text style={styles.subtitle}>Saisie propriétaire uniquement.</Text>
      </View>
      <View style={styles.form}>
        <AppInput label="Titre" value={titre} onChangeText={setTitre} placeholder="Consultation" />
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
});
