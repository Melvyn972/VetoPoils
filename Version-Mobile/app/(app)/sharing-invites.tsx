import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { acceptShare, fetchPendingInvitations } from "@/features/sharing/sharing.service";
import { useSession } from "@/hooks/useSession";
import { colors, spacing, typography } from "@/theme";
import { getErrorMessage } from "@/utils/errors";
import { formatDate } from "@/utils/dates";

type PendingShare = Awaited<ReturnType<typeof fetchPendingInvitations>>[number];

export default function SharingInvitesScreen() {
  const { profile } = useSession();
  const [invites, setInvites] = useState<PendingShare[]>([]);

  const refresh = useCallback(async () => {
    if (!profile?.email) return;
    setInvites(await fetchPendingInvitations(profile.email));
  }, [profile?.email]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const accept = async (shareId: string) => {
    try {
      await acceptShare(shareId);
      await refresh();
      Alert.alert("Invitation acceptée", "Vous pouvez maintenant accéder à l'animal partagé.");
    } catch (error) {
      Alert.alert("Acceptation impossible", getErrorMessage(error));
    }
  };

  return (
    <Screen style={styles.screen} scroll>
      <View>
        <Text style={styles.title}>Invitations de partage</Text>
        <Text style={styles.subtitle}>
          Acceptez les invitations reçues pour accéder aux animaux partagés avec vous.
        </Text>
      </View>

      {invites.length === 0 ? (
        <EmptyState
          icon="email-outline"
          title="Aucune invitation"
          description="Les invitations envoyées à votre adresse email apparaîtront ici."
        />
      ) : (
        <View style={styles.list}>
          {invites.map((invite) => {
            const animal = invite.animaux as { nom?: string; espece?: string } | null;
            return (
              <AppCard key={invite.id}>
                <Text style={styles.animalName}>{animal?.nom ?? "Animal"}</Text>
                <Text style={styles.meta}>
                  {animal?.espece ?? "—"} · {invite.email_invite}
                </Text>
                <View style={styles.badges}>
                  <Badge
                    label={invite.role === "contributor" ? "Contributeur" : "Lecture seule"}
                    tone="info"
                  />
                  <Badge label="En attente" tone="warning" />
                </View>
                <Text style={styles.date}>Invité le {formatDate(invite.created_at)}</Text>
                <AppButton title="Accepter l'invitation" onPress={() => accept(invite.id)} />
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
