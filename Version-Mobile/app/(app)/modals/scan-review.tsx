import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { FilterChips } from "@/components/ui/FilterChips";
import { Screen } from "@/components/ui/Screen";
import { updateDocumentMetadata } from "@/features/documents/documents.service";
import { peekPendingScanReview, takePendingScanReview } from "@/features/documents/scanReview.store";
import { createExpense } from "@/features/expenses/expenses.service";
import { createMedicalEvent } from "@/features/medical/medical.service";
import { useSession } from "@/hooks/useSession";
import { isOcrConfigured } from "@/lib/env";
import { colors, radius, spacing, typography } from "@/theme";
import type { DocumentCategory } from "@/types/database.types";
import { dateInputToIso } from "@/utils/dates";
import { getErrorMessage } from "@/utils/errors";
import { expenseCategoryFromDocument } from "@/utils/expenses";
import { categoryToMedicalEventType, documentCategoryLabels } from "@/utils/ocr";

const CATEGORY_OPTIONS = (
  Object.entries(documentCategoryLabels) as Array<[DocumentCategory, string]>
).map(([value, label]) => ({ value, label }));

export default function ScanReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const pending = useMemo(() => peekPendingScanReview(), []);

  const [category, setCategory] = useState<DocumentCategory>(pending?.extraction.category ?? "autre");
  const [titre, setTitre] = useState(pending?.extraction.titre ?? "");
  const [diagnostic, setDiagnostic] = useState(pending?.extraction.diagnostic ?? "");
  const [traitement, setTraitement] = useState(pending?.extraction.traitement ?? "");
  const [montant, setMontant] = useState(
    pending?.extraction.montant != null ? String(pending.extraction.montant) : "",
  );
  const [poids, setPoids] = useState(
    pending?.extraction.poidsKg != null ? String(pending.extraction.poidsKg) : "",
  );
  const [createEvent, setCreateEvent] = useState(true);
  const [createExpenseItem, setCreateExpenseItem] = useState(
    pending?.extraction.montant != null || pending?.extraction.category === "facture",
  );
  const [loading, setLoading] = useState(false);

  if (!pending || pending.animalId !== id) {
    return (
      <Screen>
        <Text style={styles.title}>Analyse introuvable</Text>
        <Text style={styles.subtitle}>
          Reprenez l’import depuis Documents. Le fichier déjà enregistré reste dans le dossier.
        </Text>
        <AppButton title="Retour" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const ocrReady = pending.ocrConfigured && !pending.ocrError && pending.extraction.source === "api";

  const submit = async () => {
    setLoading(true);
    try {
      let medicalEventId: string | null = null;
      const weightValue = poids.trim() ? Number(poids.replace(",", ".")) : undefined;
      const amountValue = montant.trim() ? Number(montant.replace(",", ".").replace(/[^\d.-]/g, "")) : null;
      const dateEvent = dateInputToIso(pending.extraction.dateEvent);

      if (createEvent) {
        const event = await createMedicalEvent({
          animal_id: pending.animalId,
          type: categoryToMedicalEventType(category),
          titre: titre.trim() || documentCategoryLabels[category],
          description: traitement.trim() || undefined,
          diagnostic: diagnostic.trim() || undefined,
          traitement: traitement.trim() || undefined,
          poids_kg: weightValue,
          date_event: dateEvent ?? undefined,
        });
        medicalEventId = event.id;
      }

      if (createExpenseItem && user?.id) {
        if (!amountValue || Number.isNaN(amountValue) || amountValue <= 0) {
          throw new Error("Indiquez un montant positif pour enregistrer la dépense.");
        }
        await createExpense({
          animal_id: pending.animalId,
          category: expenseCategoryFromDocument(category),
          montant: amountValue,
          cree_par: user.id,
          description: titre.trim() || documentCategoryLabels[category],
          date_depense: pending.extraction.dateEvent?.slice(0, 10),
          medical_event_id: medicalEventId,
        });
      }

      await updateDocumentMetadata(pending.document.id, {
        category_ocr: category,
        medical_event_id: medicalEventId,
        raw_ocr_json: {
          ...pending.extraction.raw,
          source: pending.extraction.source,
          overridden_category: category,
          titre: titre.trim(),
        },
      });

      takePendingScanReview();
      Alert.alert(
        "Document classé",
        createEvent
          ? "L’événement a été ajouté à l’historique. Vous pouvez le retrouver dans le carnet."
          : "La catégorie a été enregistrée dans Documents.",
      );
      router.replace({ pathname: "/(app)/animal/documents", params: { id: pending.animalId } });
    } catch (error) {
      Alert.alert("Enregistrement impossible", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Vérifier le document</Text>
        <Text style={styles.subtitle}>
          {ocrReady
            ? "Champs extraits automatiquement - corrigez-les si besoin avant d’enregistrer."
            : isOcrConfigured()
              ? pending.ocrError
                ? `Analyse indisponible (${pending.ocrError}). Complétez les champs à la main.`
                : "Clé OCR présente, mais aucun texte n’a été extrait. Complétez les champs."
              : "Aucune clé OCR n’est configurée (EXPO_PUBLIC_OCR_API_URL / KEY). L’import et la saisie manuelle restent disponibles."}
        </Text>
      </View>

      <Text style={styles.fileName}>{pending.document.file_name}</Text>
      <FilterChips options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />

      <View style={styles.form}>
        <AppInput label="Titre" value={titre} onChangeText={setTitre} placeholder="Ex. Ordonnance otite" />
        <AppInput
          label="Diagnostic / objet"
          value={diagnostic}
          onChangeText={setDiagnostic}
          placeholder="Optionnel"
        />
        <AppInput
          label="Traitement / notes"
          value={traitement}
          onChangeText={setTraitement}
          multiline
          placeholder="Optionnel"
        />
        <AppInput
          label="Poids (kg)"
          value={poids}
          onChangeText={setPoids}
          keyboardType="decimal-pad"
          placeholder="Optionnel"
        />
        <AppInput
          label="Montant (€)"
          value={montant}
          onChangeText={setMontant}
          keyboardType="decimal-pad"
          placeholder="Pour une facture"
        />
      </View>

      <Pressable
        style={styles.checkRow}
        onPress={() => setCreateEvent((value) => !value)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: createEvent }}
      >
        <MaterialCommunityIcons
          name={createEvent ? "checkbox-marked" : "checkbox-blank-outline"}
          size={24}
          color={colors.primary}
        />
        <Text style={styles.checkLabel}>Créer un événement médical</Text>
      </Pressable>
      <Pressable
        style={styles.checkRow}
        onPress={() => setCreateExpenseItem((value) => !value)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: createExpenseItem }}
      >
        <MaterialCommunityIcons
          name={createExpenseItem ? "checkbox-marked" : "checkbox-blank-outline"}
          size={24}
          color={colors.primary}
        />
        <Text style={styles.checkLabel}>Enregistrer une dépense</Text>
      </Pressable>

      <AppButton
        title={loading ? "Enregistrement..." : "Enregistrer"}
        onPress={() => void submit()}
        disabled={loading}
      />
      <AppButton title="Plus tard" variant="secondary" onPress={() => router.back()} />
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
  fileName: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  form: {
    gap: spacing.md,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  checkLabel: {
    flex: 1,
    color: colors.text,
    fontWeight: "700",
  },
});
