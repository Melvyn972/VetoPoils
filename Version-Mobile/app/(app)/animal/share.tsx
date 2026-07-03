import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppInput } from "@/components/ui/AppInput";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { fetchShares, inviteShare } from "@/features/sharing/sharing.service";
import { useSession } from "@/hooks/useSession";
import { colors, spacing, typography } from "@/theme";
import type { AnimalShare, PartageRole } from "@/types/database.types";
import { getErrorMessage } from "@/utils/errors";
import { isEmail } from "@/utils/validators";

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
        email_invite: email.trim(),
        role,
        invite_par: user.id,
      });
      setEmail("");
      await refresh();
    } catch (error) {
      Alert.alert("Invitation impossible", getErrorMessage(error));
    }
  };

  return (
    <Screen style={styles.screen}>
      <View>
        <Text style={styles.title}>Partage</Text>
        <Text style={styles.subtitle}>Invitez famille ou pet-sitter en lecture ou contribution.</Text>
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
                <Badge label={share.role} tone="info" />
                <Badge
                  label={share.statut}
                  tone={share.statut === "acceptee" ? "success" : "warning"}
                />
              </View>
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
});
