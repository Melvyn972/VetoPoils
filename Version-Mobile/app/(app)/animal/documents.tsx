import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DocumentCard } from "@/components/documents/DocumentCard";
import { AppButton } from "@/components/ui/AppButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Screen } from "@/components/ui/Screen";
import { fetchDocuments } from "@/features/documents/documents.service";
import type { DocumentFilter } from "@/features/documents/documents.types";
import { colors, spacing, typography } from "@/theme";
import type { Document } from "@/types/database.types";

const filters = [
  { label: "Tout", value: "all" },
  { label: "Ordonnances", value: "ordonnance" },
  { label: "Factures", value: "facture" },
  { label: "Analyses", value: "analyse_sanguine" },
  { label: "Vaccins", value: "vaccination" },
] satisfies { label: string; value: DocumentFilter }[];

export default function DocumentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState<DocumentFilter>("all");

  const refresh = useCallback(() => {
    if (id) fetchDocuments(id).then(setDocuments);
  }, [id]);

  useEffect(refresh, [refresh]);
  useFocusEffect(refresh);

  const filtered = useMemo(() => {
    if (filter === "all") return documents;
    return documents.filter((document) => document.category_ocr === filter);
  }, [documents, filter]);

  return (
    <Screen style={styles.screen}>
      <View>
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.subtitle}>Ordonnances, analyses, vaccins et factures.</Text>
      </View>
      <View style={styles.actions}>
        <AppButton
          title="Uploader un document"
          variant="secondary"
          onPress={() => router.push({ pathname: "/(app)/modals/upload-document", params: { id } })}
        />
        <AppButton
          title="Smart Scan OCR"
          onPress={() => router.push({ pathname: "/(app)/modals/scan-document", params: { id } })}
        />
      </View>
      <FilterChips options={filters} value={filter} onChange={setFilter} />
      {filtered.length === 0 ? (
        <EmptyState
          icon="file-document-outline"
          title="Aucun document"
          description="Importez une photo ou un PDF médical pour le classer dans le dossier."
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((document) => (
            <DocumentCard key={document.id} document={document} />
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
  actions: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
