import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DocumentCard } from "@/components/documents/DocumentCard";
import { PartnerSuggestions } from "@/components/partners/PartnerSuggestions";
import { AppButton } from "@/components/ui/AppButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Screen } from "@/components/ui/Screen";
import { fetchAnimal } from "@/features/animals/animals.service";
import { fetchDocuments } from "@/features/documents/documents.service";
import type { DocumentFilter } from "@/features/documents/documents.types";
import { useAnimalAccess } from "@/hooks/useAnimalAccess";
import { isOcrConfigured } from "@/lib/env";
import { colors, spacing, typography } from "@/theme";
import type { Animal, Document } from "@/types/database.types";

const filters = [
  { label: "Tout", value: "all" },
  { label: "Ordonnances", value: "ordonnance" },
  { label: "Factures", value: "facture" },
  { label: "Analyses", value: "analyse_sanguine" },
  { label: "Vaccins", value: "vaccination" },
  { label: "Autres", value: "autre" },
] satisfies { label: string; value: DocumentFilter }[];

export default function DocumentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { access } = useAnimalAccess(id);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState<DocumentFilter>("all");
  const ocrReady = isOcrConfigured();

  const refresh = useCallback(() => {
    if (!id) return;
    fetchDocuments(id).then(setDocuments).catch(() => setDocuments([]));
    fetchAnimal(id).then(setAnimal).catch(() => setAnimal(null));
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
        <Text style={styles.subtitle}>
          {ocrReady
            ? "Importez une photo ou un PDF : la lecture automatique propose une catégorie (ordonnance, facture, analyse, vaccin) que vous pouvez corriger."
            : "Importez une photo ou un PDF. Sans clé OCR, une catégorie est suggérée d’après le nom du fichier, puis vous validez les champs à la main."}
        </Text>
      </View>
      {access.canWrite ? (
        <View style={styles.actions}>
          <AppButton
            title="Importer un document"
            variant="secondary"
            onPress={() => router.push({ pathname: "/(app)/modals/upload-document", params: { id } })}
          />
          <AppButton
            title="Photographier un document"
            onPress={() => router.push({ pathname: "/(app)/modals/scan-document", params: { id } })}
          />
        </View>
      ) : (
        <Text style={styles.subtitle}>Lecture seule : les documents restent consultables.</Text>
      )}
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
      <PartnerSuggestions animal={animal} contexte="documents" />
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
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
