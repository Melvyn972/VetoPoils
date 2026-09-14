import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { ExpenseChart } from "@/components/expenses/ExpenseChart";
import { PartnerSuggestions } from "@/components/partners/PartnerSuggestions";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Screen } from "@/components/ui/Screen";
import { fetchAnimal } from "@/features/animals/animals.service";
import { deleteExpense, fetchExpenses } from "@/features/expenses/expenses.service";
import { useAnimalAccess } from "@/hooks/useAnimalAccess";
import { colors, radius, spacing, typography } from "@/theme";
import type { Animal, Expense, ExpenseCategory } from "@/types/database.types";
import { formatDate } from "@/utils/dates";
import { getErrorMessage } from "@/utils/errors";
import {
  expenseCategoryLabels,
  expensesToCsv,
  formatEuro,
  sumByCategory,
} from "@/utils/expenses";

const filters: { label: string; value: "all" | ExpenseCategory }[] = [
  { label: "Tout", value: "all" },
  { label: "Vétérinaire", value: "veterinaire" },
  { label: "Alimentation", value: "alimentation" },
  { label: "Accessoires", value: "accessoires" },
  { label: "Pharmacie", value: "pharmacie" },
  { label: "Autre", value: "autre" },
];

export default function BudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { access } = useAnimalAccess(id);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<"all" | ExpenseCategory>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [nextAnimal, nextExpenses] = await Promise.all([fetchAnimal(id), fetchExpenses(id)]);
      setAnimal(nextAnimal);
      setExpenses(nextExpenses);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void refresh();
    }, [refresh]),
  );

  const filtered = useMemo(() => {
    if (filter === "all") return expenses;
    return expenses.filter((expense) => expense.category === filter);
  }, [expenses, filter]);

  const totals = useMemo(() => sumByCategory(expenses), [expenses]);
  const total = expenses.reduce((sum, expense) => sum + Number(expense.montant), 0);

  const exportCsv = async () => {
    if (expenses.length === 0) {
      Alert.alert("Rien à exporter", "Ajoutez une dépense avant d’exporter le budget.");
      return;
    }

    setExporting(true);
    try {
      const csv = `\uFEFF${expensesToCsv(
        expenses.map((expense) => ({
          ...expense,
          animalNom: animal?.nom,
        })),
      )}`;
      const safeName = (animal?.nom ?? "animal").replace(/[^\w-]+/g, "-");
      const uri = `${FileSystem.cacheDirectory}budget-${safeName}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "text/csv",
          dialogTitle: "Exporter le budget",
        });
      } else {
        await Share.share({ title: "Budget Vet'OPoil", message: csv });
      }
    } catch (exportError) {
      Alert.alert("Export impossible", getErrorMessage(exportError));
    } finally {
      setExporting(false);
    }
  };

  const remove = (expense: Expense) => {
    Alert.alert("Supprimer la dépense", `${formatEuro(Number(expense.montant))} — ${expense.description || expenseCategoryLabels[expense.category]}`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          void deleteExpense(expense.id)
            .then(refresh)
            .catch((deleteError) => Alert.alert("Suppression impossible", getErrorMessage(deleteError)));
        },
      },
    ]);
  };

  return (
    <Screen style={styles.screen} scroll>
      <View>
        <Text style={styles.title}>Budget vétérinaire</Text>
        <Text style={styles.subtitle}>
          Suivez les frais de {animal?.nom ?? "l’animal"} par catégorie, puis exportez un CSV.
        </Text>
      </View>

      {access.canWrite ? (
        <AppButton
          title="Ajouter une dépense"
          onPress={() => router.push({ pathname: "/(app)/modals/add-expense", params: { id } })}
        />
      ) : (
        <Text style={styles.subtitle}>Lecture seule : le budget n’est visible que si vous avez un accès en écriture.</Text>
      )}

      {loading ? (
        <Text style={styles.subtitle}>Chargement du budget...</Text>
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="Budget indisponible" description={error} />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon="cash-multiple"
          title="Aucune dépense"
          description="Ajoutez une consultation, une alimentation ou un accessoire pour démarrer le suivi."
        />
      ) : (
        <>
          <AppCard>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatEuro(total)}</Text>
            <ExpenseChart totals={totals} />
          </AppCard>
          <AppButton
            title={exporting ? "Export..." : "Exporter en CSV"}
            variant="secondary"
            onPress={() => void exportCsv()}
            disabled={exporting}
          />
          <FilterChips options={filters} value={filter} onChange={setFilter} />
          {filtered.length === 0 ? (
            <EmptyState
              icon="filter-outline"
              title="Aucune dépense dans ce filtre"
              description="Changez de catégorie ou ajoutez une nouvelle ligne."
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((expense) => (
                <Pressable
                  key={expense.id}
                  style={styles.row}
                  onPress={() =>
                    access.canWrite
                      ? router.push({
                          pathname: "/(app)/modals/add-expense",
                          params: { id, expenseId: expense.id },
                        })
                      : undefined
                  }
                  accessibilityRole={access.canWrite ? "button" : "summary"}
                  accessibilityLabel={`${expenseCategoryLabels[expense.category]} ${formatEuro(Number(expense.montant))}`}
                >
                  <View style={styles.rowIcon}>
                    <MaterialCommunityIcons name="receipt" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowTitle}>
                      {expense.description?.trim() || expenseCategoryLabels[expense.category]}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {expenseCategoryLabels[expense.category]} · {formatDate(expense.date_depense)}
                    </Text>
                  </View>
                  <View style={styles.rowActions}>
                    <Text style={styles.rowAmount}>{formatEuro(Number(expense.montant))}</Text>
                    {access.canWrite ? (
                      <Pressable
                        onPress={() => remove(expense)}
                        accessibilityRole="button"
                        accessibilityLabel="Supprimer la dépense"
                        hitSlop={8}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      <PartnerSuggestions animal={animal} contexte="budget" />
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
    lineHeight: 20,
  },
  totalLabel: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  totalValue: {
    ...typography.title,
    color: colors.primaryDark,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontWeight: "800",
    color: colors.text,
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  rowActions: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  rowAmount: {
    fontWeight: "900",
    color: colors.text,
  },
});
