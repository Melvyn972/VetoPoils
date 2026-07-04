import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppInput } from "@/components/ui/AppInput";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { fetchShares, inviteShare, revokeShare } from "@/features/sharing/sharing.service";
import { useSession } from "@/hooks/useSession";
import { colors, spacing, typography } from "@/theme";
import type { AnimalShare, PartageRole } from "@/types/database.types";
import { getErrorMessage } from "@/utils/errors";
import { formatDate } from "@/utils/dates";
import { isEmail } from "@/utils/validators";

const roleLabels: Record<PartageRole, string> = {
  read_only: "Lecture seule",
  contributor: "Contributeur",
};

const statusLabels: Record<AnimalShare["statut"], string> = {
  en_attente: "En attente",
  acceptee: "Acceptée",
  revoquee: "Révoquée",
};

export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PartageRole>("read_only");
  const [shares, setShares] = useState<AnimalShare[]>([]);

  const refresh = async () => {
    if (id) setShares(await fetchShares(id));
  };

  useEffect(() => {
    refresh();
  }, [id]);

  const invite = async () => {
    if (!id || !user?.id || !isEmail(email)) {
      Alert.alert("Invitation invalide", "Saisissez une adresse email valide.");
      return;
    }

    try {
      await inviteShare({
        animal_id: id,
        email_invite: email.trim().toLowerCase(),
        role,
        invite_par: user.id,
      });
      setEmail("");
      await refresh();
      Alert.alert("Invitation envoyée", "La personne recevra l'accès après acceptation.");
    } catch (error) {
      Alert.alert("Invitation impossible", getErrorMessage(error));
    }
  };

  const revoke = async (shareId: string) => {
    try {
      await revokeShare(shareId);
      await refresh();
    } catch (error) {
      Alert.alert("Révocation impossible", getErrorMessage(error));
    }
  };

  return (
    <Screen style={styles.screen} scroll>
      <View>
        <Text style={styles.title}>Partage de l'animal</Text>
        <Text style={styles.subtitle}>
          Invitez un proche ou un pet-sitter à consulter ou contribuer au dossier santé.
        </Text>
      </View>
      <AppCard>
        <AppInput
          label="Email de l'invité"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={styles.roleRow}>
          <AppButton
            title="Lecture seule"
            variant={role === "read_only" ? "primary" : "secondary"}
            onPress={() => setRole("read_only")}
            style={styles.roleButton}
          />
          <AppButton
            title="Contributeur"
            variant={role === "contributor" ? "primary" : "secondary"}
            onPress={() => setRole("contributor")}
            style={styles.roleButton}
          />
        </View>
        <AppButton title="Envoyer l'invitation" onPress={invite} />
      </AppCard>

      {shares.length === 0 ? (
        <EmptyState
          icon="account-multiple-outline"
          title="Aucun partage"
          description="Les invitations envoyées apparaîtront ici avec leur statut."
        />
      ) : (
        <View style={styles.list}>
          {shares.map((share) => (
            <AppCard key={share.id}>
              <Text style={styles.email}>{share.email_invite}</Text>
              <View style={styles.badges}>
                <Badge label={roleLabels[share.role]} tone="info" />
                <Badge
                  label={statusLabels[share.statut]}
                  tone={
                    share.statut === "acceptee"
                      ? "success"
                      : share.statut === "revoquee"
                        ? "warning"
                        : "warning"
                  }
                />
              </View>
              <Text style={styles.date}>Créé le {formatDate(share.created_at)}</Text>
              {share.statut !== "revoquee" ? (
                <AppButton
                  title="Révoquer l'accès"
                  variant="danger"
                  onPress={() => revoke(share.id)}
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
    lineHeight: 20,
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
  },
  email: {
    ...typography.cardTitle,
    color: colors.text,
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
