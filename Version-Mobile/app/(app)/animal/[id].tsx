import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AnimalAvatar } from "@/components/animal/AnimalAvatar";
import { AnimalInfoCards } from "@/components/animal/AnimalInfoCards";
import { HealthScoreCard } from "@/components/animal/HealthScoreCard";
import { PartnerSuggestions } from "@/components/partners/PartnerSuggestions";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { fetchAnimal } from "@/features/animals/animals.service";
import { emailAnimalDossierFallback, shareAnimalDossier } from "@/features/dossier/shareDossier";
import { fetchDocuments } from "@/features/documents/documents.service";
import { useHealthScore } from "@/features/health/useHealthScore";
import { fetchMedicalEvents } from "@/features/medical/medical.service";
import { fetchReminders } from "@/features/reminders/reminders.service";
import { useAnimalAccess } from "@/hooks/useAnimalAccess";
import { colors, radius, spacing, typography } from "@/theme";
import type { Animal, Document, MedicalEvent, Reminder } from "@/types/database.types";
import { getErrorMessage } from "@/utils/errors";
import { formatSexe } from "@/utils/formatters";

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { access } = useAnimalAccess(id);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchAnimal(id),
      fetchMedicalEvents(id),
      fetchReminders(id),
      fetchDocuments(id),
    ])
      .then(([nextAnimal, nextEvents, nextReminders, nextDocuments]) => {
        setAnimal(nextAnimal);
        setEvents(nextEvents);
        setReminders(nextReminders);
        setDocuments(nextDocuments);
      })
      .catch((error) => {
        Alert.alert("Fiche indisponible", getErrorMessage(error));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(refresh, [refresh]);
  useFocusEffect(refresh);

  const { result: healthScore, saving, refresh: refreshScore } = useHealthScore({
    animal,
    events,
    reminders,
    canPersist: access.canWrite,
    onPersisted: (next) => {
      setAnimal((current) => (current ? { ...current, score_sante: next.score } : current));
    },
  });

  const links: { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; route: string }[] = [
    { label: "Historique de consultation", icon: "history", route: "timeline" },
    { label: "Documents", icon: "file-document-outline", route: "documents" },
    { label: "Budget", icon: "cash-multiple", route: "budget" },
    { label: "Journal quotidien", icon: "notebook-outline", route: "journal" },
  ];

  if (access.canManageShares) {
    links.push({ label: "Partage", icon: "account-multiple-plus-outline", route: "share" });
  }

  const exportDossier = async (mode: "share" | "email") => {
    if (!animal) return;
    setExporting(true);
    try {
      if (mode === "email") {
        await emailAnimalDossierFallback(animal);
        return;
      }
      await shareAnimalDossier({ animal, events, documents, reminders });
    } catch (error) {
      Alert.alert("Export impossible", getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  if (loading && !animal) {
    return (
      <Screen>
        <Text style={styles.subtitle}>Chargement de la fiche...</Text>
      </Screen>
    );
  }

  if (!animal) {
    return (
      <Screen>
        <EmptyState
          icon="paw-off"
          title="Animal introuvable"
          description="Cette fiche a été archivée ou n’est plus accessible."
        />
        <AppButton title="Retour aux animaux" variant="secondary" onPress={() => router.replace("/(app)/animals")} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <AppCard style={styles.hero}>
        <AnimalAvatar animal={animal} size={92} />
        <Text style={styles.name}>{animal.nom}</Text>
        <Text style={styles.meta}>
          {animal.espece}
          {animal.race ? ` • ${animal.race}` : ""}
        </Text>
        <Badge label={animal.puce ? "Puce renseignée" : "Puce à compléter"} tone={animal.puce ? "info" : "warning"} />
      </AppCard>

      {access.canWrite ? (
        <Pressable
          style={styles.editButton}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/(app)/animal/edit", params: { id: animal.id } })}
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
          <Text style={styles.editText}>Modifier la fiche</Text>
        </Pressable>
      ) : (
        <Text style={styles.subtitle}>
          {access.level === "contributor"
            ? "Accès contributeur : vous pouvez remplir le journal quotidien."
            : "Accès lecture seule."}
        </Text>
      )}

      <AnimalInfoCards dateNaissance={animal.date_naissance} events={events} />

      <AppCard>
        <Text style={styles.metricLabel}>Sexe</Text>
        <Text style={styles.metricValue}>{formatSexe(animal.sexe)}</Text>
        <Text style={styles.metricLabel}>Couleur</Text>
        <Text style={styles.metricValue}>{animal.couleur ?? "Non renseignée"}</Text>
        <Text style={styles.metricLabel}>Numéro de puce</Text>
        <Text style={styles.metricValue}>{animal.puce ?? "Optionnel / non renseigné"}</Text>
      </AppCard>

      <HealthScoreCard result={healthScore} saving={saving} onRefresh={access.canWrite ? () => void refreshScore() : undefined} />

      {access.canWrite ? (
        <View style={styles.exportRow}>
          <AppButton
            title={exporting ? "Préparation..." : "Exporter le PDF"}
            onPress={() => void exportDossier("share")}
            disabled={exporting}
          />
          <AppButton
            title="Envoyer par e-mail"
            variant="secondary"
            onPress={() => void exportDossier("email")}
            disabled={exporting}
          />
        </View>
      ) : null}

      <View style={styles.links}>
        {links.map((link) => (
          <Pressable
            key={link.route}
            style={styles.link}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: `/(app)/animal/${link.route}`,
                params: { id: animal.id },
              })
            }
          >
            <View style={styles.linkIcon}>
              <MaterialCommunityIcons name={link.icon} size={24} color={colors.primary} />
            </View>
            <Text style={styles.linkText}>{link.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <PartnerSuggestions animal={animal} contexte="fiche-animal" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 110,
  },
  hero: {
    alignItems: "center",
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  meta: {
    color: colors.textMuted,
  },
  subtitle: {
    color: colors.textMuted,
  },
  metricLabel: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.text,
    fontWeight: "900",
  },
  links: {
    gap: spacing.md,
  },
  exportRow: {
    gap: spacing.sm,
  },
  editButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    padding: spacing.md,
  },
  editText: {
    color: colors.primary,
    fontWeight: "900",
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    flex: 1,
    color: colors.text,
    fontWeight: "900",
  },
});
