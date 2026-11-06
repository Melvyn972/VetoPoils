import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { Badge } from "@/components/ui/Badge";
import { fetchDocumentsForEvent } from "@/features/documents/documents.service";
import { fetchMedicalEvents, validateMedicalEvent } from "@/features/medical/medical.service";
import { colors, radius, spacing, typography } from "@/theme";
import type { Document, MedicalEvent } from "@/types/database.types";
import { formatDate } from "@/utils/dates";
import { getErrorMessage } from "@/utils/errors";
import { getMedicalEventSummary, getMedicalEventTypeLabel } from "@/utils/medicalLabels";

export default function ConsultationDetailModal() {
  const { eventId, animalId } = useLocalSearchParams<{ eventId: string; animalId: string }>();
  const [event, setEvent] = useState<MedicalEvent | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  const load = async () => {
    if (!eventId || !animalId) return;
    const events = await fetchMedicalEvents(animalId);
    const found = events.find((item) => item.id === eventId) ?? null;
    setEvent(found);
    if (found) {
      setDocuments(await fetchDocumentsForEvent(found.id));
    }
  };

  useEffect(() => {
    load();
  }, [eventId, animalId]);

  const validate = async () => {
    if (!event) return;
    try {
      await validateMedicalEvent(event.id);
      await load();
    } catch (error) {
      Alert.alert("Validation impossible", getErrorMessage(error));
    }
  };

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Chargement...</Text>
      </View>
    );
  }

  const typeLabel = getMedicalEventTypeLabel(event.type);
  const summary = getMedicalEventSummary(event);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Détail consultation</Text>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{event.titre ?? typeLabel}</Text>
        <View style={styles.badges}>
          {event.vet_token_id ? <Badge label="Vétérinaire" tone="info" /> : null}
          <Badge
            label={event.status === "pending" ? "À valider" : "Validé"}
            tone={event.status === "pending" ? "warning" : "success"}
          />
        </View>
        <Text style={styles.date}>{formatDate(event.date_event)}</Text>
      </View>

      {!!event.diagnostic && (
        <View style={styles.block}>
          <Text style={styles.label}>Diagnostic</Text>
          <Text style={styles.value}>{event.diagnostic}</Text>
        </View>
      )}
      {!!event.description && (
        <View style={styles.block}>
          <Text style={styles.label}>Détails</Text>
          <Text style={styles.value}>{event.description}</Text>
        </View>
      )}
      {!!event.traitement && (
        <View style={styles.block}>
          <Text style={styles.label}>Traitement</Text>
          <Text style={styles.value}>{event.traitement}</Text>
        </View>
      )}
      {event.poids_kg != null && (
        <View style={styles.block}>
          <Text style={styles.label}>Poids</Text>
          <Text style={styles.value}>{event.poids_kg} kg</Text>
        </View>
      )}
      {!event.diagnostic && !event.description && !event.traitement && event.poids_kg == null && !!summary ? (
        <Text style={styles.value}>{summary}</Text>
      ) : null}

      <View style={styles.documentsSection}>
        <Text style={styles.sectionTitle}>Documents attachés ({documents.length})</Text>
        {documents.length === 0 ? (
          <Text style={styles.emptyDocs}>Aucun document pour cette consultation.</Text>
        ) : (
          documents.map((doc) => (
            <Pressable
              key={doc.id}
              style={styles.docRow}
              onPress={() =>
                router.push({
                  pathname: "/(app)/modals/view-document",
                  params: {
                    filePath: doc.file_path,
                    fileName: doc.file_name,
                    mimeType: doc.mime_type,
                  },
                })
              }
            >
              <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.primary} />
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.file_name}</Text>
                <Text style={styles.docMeta}>{formatDate(doc.created_at)}</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>

      {event.status === "pending" ? (
        <AppButton title="Valider la consultation" onPress={validate} />
      ) : null}

      <AppButton title="Fermer" variant="secondary" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  topTitle: {
    ...typography.heading,
    color: colors.text,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loading: {
    padding: spacing.lg,
    color: colors.textMuted,
  },
  header: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  badges: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  date: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  block: {
    gap: 4,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    color: colors.text,
    lineHeight: 22,
  },
  documentsSection: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colors.text,
  },
  emptyDocs: {
    color: colors.textMuted,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontWeight: "700",
    color: colors.text,
  },
  docMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
