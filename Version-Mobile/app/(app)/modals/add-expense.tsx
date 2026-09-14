import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { FilterChips } from "@/components/ui/FilterChips";
import { Screen } from "@/components/ui/Screen";
import { createExpense, fetchExpense, updateExpense } from "@/features/expenses/expenses.service";
import { useSession } from "@/hooks/useSession";
import { colors, spacing, typography } from "@/theme";
import type { ExpenseCategory } from "@/types/database.types";
import { getErrorMessage } from "@/utils/errors";
import { expenseCategoryOptions } from "@/utils/expenses";

export default function AddExpenseScreen() {
  const { id, expenseId } = useLocalSearchParams<{ id: string; expenseId?: string }>();
  const { user } = useSession();
  const [category, setCategory] = useState<ExpenseCategory>("veterinaire");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [dateDepense, setDateDepense] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(expenseId));

  useEffect(() => {
    if (!expenseId) return;
    void fetchExpense(expenseId)
      .then((expense) => {
        if (!expense) {
          Alert.alert("Dépense introuvable", "Elle a peut-être déjà été supprimée.");
          return;
        }
        setCategory(expense.category);
        setMontant(String(expense.montant));
        setDescription(expense.description ?? "");
        setDateDepense(expense.date_depense);
      })
      .catch((error) => Alert.alert("Chargement impossible", getErrorMessage(error)))
      .finally(() => setLoadingExisting(false));
  }, [expenseId]);

  const submit = async () => {
    if (!id || !user?.id) {
      Alert.alert("Dépense incomplète", "Animal ou compte introuvable.");
      return;
    }

    const amount = Number(montant.replace(",", ".").replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Montant invalide", "Saisissez un montant supérieur à 0 €.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDepense)) {
      Alert.alert("Date invalide", "Utilisez le format AAAA-MM-JJ.");
      return;
    }

    setLoading(true);
    try {
      if (expenseId) {
        await updateExpense(expenseId, {
          category,
          montant: amount,
          description: description.trim() || null,
          date_depense: dateDepense,
        });
      } else {
        await createExpense({
          animal_id: id,
          category,
          montant: amount,
          cree_par: user.id,
          description: description.trim() || null,
          date_depense: dateDepense,
        });
      }
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
        <Text style={styles.title}>{expenseId ? "Modifier la dépense" : "Nouvelle dépense"}</Text>
        <Text style={styles.subtitle}>Classez le montant dans une catégorie du budget vétérinaire.</Text>
      </View>
      {loadingExisting ? (
        <Text style={styles.subtitle}>Chargement de la dépense...</Text>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Catégorie</Text>
          <FilterChips options={expenseCategoryOptions} value={category} onChange={setCategory} />
          <AppInput
            label="Montant (€)"
            keyboardType="decimal-pad"
            value={montant}
            onChangeText={setMontant}
            placeholder="45,00"
          />
          <AppInput
            label="Date (AAAA-MM-JJ)"
            value={dateDepense}
            onChangeText={setDateDepense}
            placeholder="2026-09-14"
          />
          <AppInput
            label="Description (optionnel)"
            value={description}
            onChangeText={setDescription}
            placeholder="Consultation, croquettes, collier..."
          />
        </View>
      )}
      <AppButton
        title={loading ? "Enregistrement..." : expenseId ? "Mettre à jour" : "Ajouter"}
        onPress={() => void submit()}
        disabled={loading || loadingExisting}
      />
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
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
