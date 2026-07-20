import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppInput } from "@/components/ui/AppInput";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { fetchAnimal } from "@/features/animals/animals.service";
import {
  accountExistsForEmail,
  fetchShares,
  inviteShare,
  revokeShare,
} from "@/features/sharing/sharing.service";
import { useSession } from "@/hooks/useSession";
import { colors, spacing, typography } from "@/theme";
import type { AnimalShare, PartageRole } from "@/types/database.types";
import { formatDate } from "@/utils/dates";
import { getErrorMessage } from "@/utils/errors";
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
  const [animalName, setAnimalName] = useState("votre animal");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    const [nextShares, animal] = await Promise.all([fetchShares(id), fetchAnimal(id)]);
    setShares(nextShares);
    if (animal?.nom) setAnimalName(animal.nom);
  }, [id]);

  useEffect(() => {
    void refresh().catch(() => setShares([]));
  }, [refresh]);

  const invite = async () => {
    if (!id || !user?.id || !isEmail(email)) {
      Alert.alert("Invitation invalide", "Saisissez une adresse email valide.");
      return;
    }

    const inviteEmail = email.trim().toLowerCase();
    if (user.email && inviteEmail === user.email.trim().toLowerCase()) {
      Alert.alert("Invitation invalide", "Vous ne pouvez pas vous inviter vous-même.");
      return;
    }

    setLoading(true);
    try {
      const exists = await accountExistsForEmail(inviteEmail);
      if (!exists) {
        Alert.alert(
          "Compte introuvable",
          `Aucun compte Vet'OPoil n'existe pour ${inviteEmail}.\n\nLa personne doit d'abord créer un compte avec cet email, puis vous pourrez l'inviter.`,
        );
        return;
      }

      await inviteShare({
        animal_id: id,
        email_invite: inviteEmail,
        role,
        invite_par: user.id,
      });
      setEmail("");
      await refresh();

      Alert.alert(
        "Invitation envoyée",
        `${inviteEmail} a un compte Vet'OPoil. Une notification apparaît dans son app.\n\nIl doit ouvrir Compte → Invitations pour accepter.`,
        [
          { text: "OK" },
          {
            text: "Prévenir aussi par message",
            onPress: () => {
              void Share.share({
                message: `Je t'ai invité à accéder au dossier de ${animalName} sur Vet'OPoil.\n\nOuvre l'app → Compte → Invitations pour accepter.`,
              });
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Invitation impossible", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (share: AnimalShare) => {
    Alert.alert(
      share.statut === "en_attente" ? "Annuler l'invitation ?" : "Révoquer l'accès ?",
      share.statut === "en_attente"
        ? `L'invitation pour ${share.email_invite} sera supprimée.`
        : `${share.email_invite} n'aura plus accès à ${animalName}.`,
      [
        { text: "Non", style: "cancel" },
        {
          text: share.statut === "en_attente" ? "Annuler l'invitation" : "Révoquer",
          style: "destructive",
          onPress: async () => {
            try {
              await revokeShare(share);
              await refresh();
            } catch (error) {
              Alert.alert("Révocation impossible", getErrorMessage(error));
            }
          },
        },
      ],
    );
  };

  const activeShares = shares.filter((share) => share.statut !== "revoquee");

  return (
    <Screen style={styles.screen} scroll>
      <View>
        <Text style={styles.title}>Partage de l'animal</Text>
        <Text style={styles.subtitle}>
          L'invité doit déjà avoir un compte Vet'OPoil. Nous vérifions l'email avant d'envoyer.
          Il accepte ensuite dans Compte → Invitations.
        </Text>
      </View>
      <AppCard>
        <AppInput
          label="Email de l'invité (compte Vet'OPoil)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="prenom@email.fr"
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
        <AppButton
          title={loading ? "Envoi..." : "Créer l'invitation"}
          onPress={invite}
          disabled={loading}
        />
      </AppCard>

      {activeShares.length === 0 ? (
        <EmptyState
          icon="account-multiple-outline"
          title="Aucun partage actif"
          description="Les invitations en attente ou acceptées apparaîtront ici."
        />
      ) : (
        <View style={styles.list}>
          {activeShares.map((share) => (
            <AppCard key={share.id}>
              <Text style={styles.email}>{share.email_invite}</Text>
              <View style={styles.badges}>
                <Badge label={roleLabels[share.role]} tone="info" />
                <Badge
                  label={statusLabels[share.statut]}
                  tone={share.statut === "acceptee" ? "success" : "warning"}
                />
              </View>
              <Text style={styles.date}>Créé le {formatDate(share.created_at)}</Text>
              <AppButton
                title={
                  share.statut === "en_attente" ? "Annuler l'invitation" : "Révoquer l'accès"
                }
                variant="danger"
                onPress={() => revoke(share)}
              />
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
