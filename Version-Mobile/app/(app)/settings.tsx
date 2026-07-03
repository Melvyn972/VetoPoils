import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Switch, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { Screen } from "@/components/ui/Screen";
import { useSession } from "@/hooks/useSession";
import { colors, radius, spacing, typography } from "@/theme";

export default function SettingsScreen() {
  const { profile, signOut } = useSession();

  const logout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <Screen style={styles.screen}>
      <View>
        <Text style={styles.title}>Compte</Text>
        <Text style={styles.subtitle}>Profil, préférences et abonnement.</Text>
      </View>

      <AppCard style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.prenom?.slice(0, 1) ?? "V"}</Text>
        </View>
        <View style={styles.profileContent}>
          <Text style={styles.name}>
            {profile?.prenom} {profile?.nom}
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <Badge label={profile?.plan === "premium" ? "Premium" : "Free"} tone="info" />
        </View>
      </AppCard>

      <AppCard>
        <SettingRow
          icon="bell-outline"
          title="Notifications push"
          description="Rappels vaccins et synchronisation"
          enabled
        />
        <SettingRow
          icon="shield-check-outline"
          title="Données sécurisées"
          description="RLS Supabase et accès propriétaire"
          enabled
        />
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Abonnement</Text>
        <Text style={styles.text}>
          Le paiement Stripe est prévu côté web. L’app lit votre plan pour appliquer les quotas.
        </Text>
      </AppCard>

      <AppButton title="Se déconnecter" variant="danger" onPress={logout} />
    </Screen>
  );
}

function SettingRow({
  icon,
  title,
  description,
  enabled,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch value={enabled} trackColor={{ true: colors.primarySoft }} thumbColor={colors.primary} />
    </View>
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
  profile: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 26,
  },
  profileContent: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.cardTitle,
    color: colors.text,
  },
  email: {
    color: colors.textMuted,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colors.text,
  },
  text: {
    color: colors.textMuted,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: "900",
    color: colors.text,
  },
  settingDescription: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
