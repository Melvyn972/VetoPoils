import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { deleteDailyLog, fetchDailyLogs } from "@/features/daily-logs/dailyLogs.service";
import { useAnimalAccess } from "@/hooks/useAnimalAccess";
import { useSession } from "@/hooks/useSession";
import { colors, spacing, typography } from "@/theme";
import type { DailyLog } from "@/types/database.types";
import { formatDate } from "@/utils/dates";
import { getErrorMessage } from "@/utils/errors";

export default function AnimalJournalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const { access } = useAnimalAccess(id);
  const [logs, setLogs] = useState<DailyLog[]>([]);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLogs(await fetchDailyLogs(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void refresh().catch((error) => Alert.alert("Journal indisponible", getErrorMessage(error)));
    }, [refresh]),
  );

  return (
    <Screen style={styles.screen} scroll>
      <View>
        <Text style={styles.title}>Journal quotidien</Text>
        <Text style={styles.subtitle}>
          Notes de pet-sitting : repas, sorties et comportement. Les contributeurs peuvent ajouter
          une entrée.
        </Text>
      </View>

      {access.canWriteDailyLog ? (
        <AppButton
          title="Ajouter une entrée"
          onPress={() => router.push({ pathname: "/(app)/modals/add-daily-log", params: { id } })}
        />
      ) : (
        <Text style={styles.hint}>Lecture seule : vous pouvez consulter le journal.</Text>
      )}

      {logs.length === 0 ? (
        <EmptyState
          icon="notebook-outline"
          title="Aucune entrée"
          description="Ajoutez le premier compte-rendu du jour pour ce compagnon."
        />
      ) : (
        <View style={styles.list}>
          {logs.map((log) => (
            <AppCard key={log.id}>
              <Text style={styles.cardTitle}>{formatDate(log.date_journal)}</Text>
              {log.repas ? <Text style={styles.line}>Repas : {log.repas}</Text> : null}
              {log.sortie ? <Text style={styles.line}>Sortie : {log.sortie}</Text> : null}
              {log.comportement ? (
                <Text style={styles.line}>Comportement : {log.comportement}</Text>
              ) : null}
              {log.notes ? <Text style={styles.line}>{log.notes}</Text> : null}
              {(access.isOwner || log.cree_par === user?.id) && access.canWriteDailyLog ? (
                <AppButton
                  title="Supprimer"
                  variant="danger"
                  onPress={() => {
                    Alert.alert("Supprimer l'entrée", "Cette action est définitive.", [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await deleteDailyLog(log.id);
                            await refresh();
                          } catch (error) {
                            Alert.alert("Suppression impossible", getErrorMessage(error));
                          }
                        },
                      },
                    ]);
                  }}
                />
              ) : null}
            </AppCard>
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
    lineHeight: 22,
  },
  hint: {
    color: colors.textMuted,
  },
  list: {
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.cardTitle,
    color: colors.text,
  },
  line: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});
