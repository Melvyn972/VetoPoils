import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { Screen } from "@/components/ui/Screen";
import { fetchNotifications } from "@/features/notifications/notifications.service";
import { syncPushPreference } from "@/features/notifications/push.service";
import {
  getPushEnabledLocal,
  setPushEnabledLocal,
} from "@/features/settings/preferences.service";
import { useSession } from "@/hooks/useSession";
import { colors, radius, spacing, typography } from "@/theme";
import type { AppNotification } from "@/types/database.types";
import { formatRelativeDueDate } from "@/utils/dates";

export default function SettingsScreen() {
  const { profile, signOut, user, refreshProfile } = useSession();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    getPushEnabledLocal().then(setPushEnabled);
    fetchNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, []);

  const togglePush = async (enabled: boolean) => {
    setPushEnabled(enabled);
    await setPushEnabledLocal(enabled);
    if (user?.id) {
      try {
        await syncPushPreference(user.id, enabled);
      } catch {
        // Profil Supabase peut ne pas encore avoir la colonne — AsyncStorage suffit
      }
    }
    await refreshProfile();
  };

  const logout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <Screen style={styles.screen} scroll>
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
          description="Rappels, nouvelles consultations et alertes santé"
          enabled={pushEnabled}
          onChange={togglePush}
        />
      </AppCard>

      <AppCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notifications récentes</Text>
          <AppButton
            title="Invitations"
            variant="secondary"
            onPress={() => router.push("/(app)/sharing-invites")}
            style={styles.inviteButton}
          />
        </View>
        {notifications.length === 0 ? (
          <Text style={styles.text}>Aucune notification pour le moment.</Text>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <View key={notification.id} style={styles.notificationRow}>
              <MaterialCommunityIcons
                name={
                  notification.type === "rappel"
                    ? "bell-ring-outline"
                    : "stethoscope"
                }
                size={20}
                color={colors.primary}
              />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.titre}</Text>
                <Text style={styles.notificationBody}>{notification.corps}</Text>
                <Text style={styles.notificationDate}>
                  {formatRelativeDueDate(notification.created_at)}
                </Text>
              </View>
            </View>
          ))
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Abonnement</Text>
        <Text style={styles.text}>
          Le paiement Stripe est prévu côté web. L'app lit votre plan pour appliquer les quotas.
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
  onChange,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
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
      <Switch
        value={enabled}
        onValueChange={onChange}
        trackColor={{ true: colors.primarySoft }}
        thumbColor={enabled ? colors.primary : colors.border}
      />
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colors.text,
    flex: 1,
  },
  inviteButton: {
    paddingHorizontal: spacing.md,
    minHeight: 36,
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
  notificationRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notificationContent: {
    flex: 1,
    gap: 2,
  },
  notificationTitle: {
    fontWeight: "800",
    color: colors.text,
  },
  notificationBody: {
    color: colors.textMuted,
    fontSize: 13,
  },
  notificationDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
