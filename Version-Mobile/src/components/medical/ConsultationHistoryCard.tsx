import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Badge } from "@/components/ui/Badge";
import { colors, radius, spacing, typography } from "@/theme";
import type { Document, MedicalEvent } from "@/types/database.types";
import { formatDate } from "@/utils/dates";
import { getMedicalEventSummary, getMedicalEventTypeLabel } from "@/utils/medicalLabels";

export function ConsultationHistoryCard({
  event,
  documents,
  onValidate,
  isLast,
}: {
  event: MedicalEvent;
  documents: Document[];
  onValidate?: () => void;
  isLast?: boolean;
}) {
  const [expanded, setExpanded] = useState(event.status === "pending");
  const typeLabel = getMedicalEventTypeLabel(event.type);
  const summary = getMedicalEventSummary(event);

  return (
    <View style={styles.wrapper}>
      <View style={styles.timeline}>
        <View style={[styles.dot, event.status === "pending" && styles.dotPending]} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      <View style={[styles.card, !isLast && styles.cardSpacing]}>
        <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{event.titre ?? typeLabel}</Text>
            <Text style={styles.date}>{formatDate(event.date_event)}</Text>
          </View>
          <View style={styles.headerBadges}>
            {event.vet_token_id ? <Badge label="Vétérinaire" tone="info" /> : null}
            <Badge
              label={event.status === "pending" ? "À valider" : "Validé"}
              tone={event.status === "pending" ? "warning" : "success"}
            />
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={22}
              color={colors.textMuted}
            />
          </View>
        </Pressable>

        {expanded ? (
          <View style={styles.body}>
            <Text style={styles.type}>{typeLabel}</Text>

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

            {!event.diagnostic &&
            !event.description &&
            !event.traitement &&
            event.poids_kg == null &&
            !!summary ? (
              <Text style={styles.value}>{summary}</Text>
            ) : null}

            <View style={styles.documentsSection}>
              <Text style={styles.documentsTitle}>
                Documents attachés ({documents.length})
              </Text>
              {documents.length === 0 ? (
                <Text style={styles.noDocs}>Aucun document pour cette consultation.</Text>
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
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.docInfo}>
                      <Text style={styles.docName} numberOfLines={1}>
                        {doc.file_name}
                      </Text>
                      <Text style={styles.docMeta}>{formatDate(doc.created_at)}</Text>
                    </View>
                    <MaterialCommunityIcons name="eye-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                ))
              )}
            </View>

            {event.status === "pending" && onValidate ? (
              <AppButton title="Valider la consultation" onPress={onValidate} />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    gap: spacing.md,
  },
  timeline: {
    width: 20,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  dotPending: {
    backgroundColor: colors.accent,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardSpacing: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerBadges: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  title: {
    ...typography.cardTitle,
    color: colors.text,
  },
  date: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  type: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  block: {
    gap: 2,
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
    marginTop: spacing.sm,
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundSoft,
    borderRadius: radius.md,
  },
  documentsTitle: {
    fontWeight: "800",
    color: colors.text,
    fontSize: 13,
  },
  noDocs: {
    color: colors.textMuted,
    fontSize: 13,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  docMeta: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
