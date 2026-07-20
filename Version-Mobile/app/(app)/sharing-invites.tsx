import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import {
  acceptShare,
  fetchPendingInvitations,
  refuseShare,
  type PendingInvitation,
} from "@/features/sharing/sharing.service";
import { useSession } from "@/hooks/useSession";
import { colors, spacing, typography } from "@/theme";
import { formatDate } from "@/utils/dates";
import { getErrorMessage } from "@/utils/errors";

export default function SharingInvitesScreen() {
  const { profile, user } = useSession();
  const [invites, setInvites] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inviteEmail = profile?.email?.trim() || user?.email?.trim() || "";

  const refresh = useCallback(async () => {
    if (!inviteEmail) {
      setInvites([]);
      setError("Aucun email associé à votre compte.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setInvites(await fetchPendingInvitations(inviteEmail));
    } catch (fetchError) {
      setInvites([]);
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
    }
  }, [inviteEmail]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const accept = async (shareId: string) => {
    try {
      await acceptShare(shareId);
      await refresh();
      Alert.alert("Invitation acceptée", "L'animal partagé apparaît maintenant dans Animaux.");
    } catch (acceptError) {
      Alert.alert("Acceptation impossible", getErrorMessage(acceptError));
    }
  };

  const refuse = async (shareId: string) => {
    try {
      await refuseShare(shareId);
      await refresh();
    } catch (refuseError) {
      Alert.alert("Refus impossible", getErrorMessage(refuseError));
    }
  };

  return (
    <Screen style={styles.screen} scroll>
      <View>
        <Text style={styles.title}>Invitations de partage</Text>
        <Text style={styles.subtitle}>
          Compte connecté : {inviteEmail || "—"}. Seules les invitations envoyées à cet email
          apparaissent ici.
        </Text>
      </View>

      {loading ? (
        <Text style={styles.meta}>Chargement...</Text>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Impossible de charger"
          description={error}
        />
      ) : invites.length === 0 ? (
        <EmptyState
          icon="email-outline"
          title="Aucune invitation"
          description={`Aucune invitation en attente pour ${inviteEmail}. Vérifiez que le propriétaire a bien utilisé exactement cet email.`}
        />
      ) : (
        <View style={styles.list}>
          {invites.map((invite) => {
            const animal = invite.animaux;
            const animalName = animal?.nom ?? invite.animal_nom ?? "Animal partagé";
            const animalSpecies = animal?.espece ?? invite.animal_espece ?? "—";

            return (
              <AppCard key={invite.id}>
                <Text style={styles.animalName}>{animalName}</Text>
                <Text style={styles.meta}>
                  {animalSpecies} · {invite.email_invite}
                </Text>
                <View style={styles.badges}>
                  <Badge
                    label={invite.role === "contributor" ? "Contributeur" : "Lecture seule"}
                    tone="info"
                  />
                  <Badge label="En attente" tone="warning" />
                </View>
                <Text style={styles.date}>Invité le {formatDate(invite.created_at)}</Text>
                <AppButton title="Accepter" onPress={() => accept(invite.id)} />
                <AppButton
                  title="Refuser"
                  variant="secondary"
                  onPress={() => refuse(invite.id)}
                />
              </AppCard>
            );
          })}
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
    lineHeight: 20,
  },
  list: {
    gap: spacing.md,
  },
  animalName: {
    ...typography.cardTitle,
    color: colors.text,
  },
  meta: {
    color: colors.textMuted,
  },
  badges: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
