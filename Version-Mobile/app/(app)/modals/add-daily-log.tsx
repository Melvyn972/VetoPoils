import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Screen } from "@/components/ui/Screen";
import { createDailyLog } from "@/features/daily-logs/dailyLogs.service";
import { useSession } from "@/hooks/useSession";
import { colors, spacing, typography } from "@/theme";
import { getErrorMessage } from "@/utils/errors";

export default function AddDailyLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const [dateJournal, setDateJournal] = useState(new Date().toISOString().slice(0, 10));
  const [repas, setRepas] = useState("");
  const [sortie, setSortie] = useState("");
  const [comportement, setComportement] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!id || !user?.id) {
      Alert.alert("Journal incomplet", "Connectez-vous pour ajouter une entrée.");
      return;
    }

    if (!repas.trim() && !sortie.trim() && !comportement.trim() && !notes.trim()) {
      Alert.alert("Journal incomplet", "Renseignez au moins un champ (repas, sortie, notes…).");
      return;
    }

    setLoading(true);
    try {
      await createDailyLog({
        animal_id: id,
        cree_par: user.id,
        date_journal: dateJournal,
        repas,
        sortie,
        comportement,
        notes,
      });
      router.back();
    } catch (error) {
      Alert.alert("Enregistrement impossible", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Entrée du journal</Text>
        <Text style={styles.subtitle}>Compte-rendu pour le pet-sitter ou le propriétaire.</Text>
      </View>
      <View style={styles.form}>
        <AppInput label="Date (AAAA-MM-JJ)" value={dateJournal} onChangeText={setDateJournal} />
        <AppInput label="Repas" value={repas} onChangeText={setRepas} placeholder="Croquettes matin + midi" />
        <AppInput label="Sortie" value={sortie} onChangeText={setSortie} placeholder="2 promenades" />
        <AppInput
          label="Comportement"
          value={comportement}
          onChangeText={setComportement}
          placeholder="Calme, a bien mangé"
        />
        <AppInput label="Notes" value={notes} onChangeText={setNotes} multiline />
      </View>
      <AppButton title={loading ? "Enregistrement..." : "Enregistrer"} onPress={submit} disabled={loading} />
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
