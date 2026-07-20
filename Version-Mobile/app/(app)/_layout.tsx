import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { ReminderAlertsProvider, useReminderAlerts } from "@/features/reminders/ReminderAlertsProvider";
import { useNotificationSetup } from "@/hooks/useNotificationSetup";
import { useSession } from "@/hooks/useSession";
import { colors } from "@/theme";

const iconSize = 24;

function AppTabs() {
  const { activeCount } = useReminderAlerts();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 88,
          paddingTop: 8,
          paddingBottom: 18,
        },
        tabBarLabelStyle: {
          fontWeight: "900",
          fontSize: 12,
          lineHeight: 15,
          marginTop: 2,
        },
        tabBarItemStyle: {
          minWidth: 68,
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-heart" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="animals"
        options={{
          title: "Animaux",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="paw" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: "QR",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="qrcode" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "Rappels",
          tabBarBadge: activeCount > 0 ? activeCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: colors.white,
            fontWeight: "800",
            fontSize: 11,
          },
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bell-outline" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Compte",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen name="animal/[id]" options={{ href: null }} />
      <Tabs.Screen name="animal/edit" options={{ href: null }} />
      <Tabs.Screen name="animal/timeline" options={{ href: null }} />
      <Tabs.Screen name="animal/documents" options={{ href: null }} />
      <Tabs.Screen name="animal/share" options={{ href: null }} />
      <Tabs.Screen name="sharing-invites" options={{ href: null }} />
      <Tabs.Screen name="modals/add-animal" options={{ href: null }} />
      <Tabs.Screen name="modals/add-medical-event" options={{ href: null }} />
      <Tabs.Screen name="modals/add-reminder" options={{ href: null }} />
      <Tabs.Screen name="modals/upload-document" options={{ href: null }} />
      <Tabs.Screen name="modals/scan-document" options={{ href: null }} />
      <Tabs.Screen name="modals/view-document" options={{ href: null }} />
      <Tabs.Screen name="modals/consultation-detail" options={{ href: null }} />
    </Tabs>
  );
}

export default function AppLayout() {
  const { loading, session, user } = useSession();

  useNotificationSetup(user?.id);

  if (!loading && !session) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <ReminderAlertsProvider>
      <AppTabs />
    </ReminderAlertsProvider>
  );
}
