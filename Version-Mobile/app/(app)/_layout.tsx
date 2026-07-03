import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { useSession } from "@/hooks/useSession";
import { colors, radius } from "@/theme";

const iconSize = 24;

export default function AppLayout() {
  const { loading, session } = useSession();

  if (!loading && !session) {
    return <Redirect href="/(auth)/onboarding" />;
  }

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
      <Tabs.Screen name="animal" options={{ href: null }} />
      <Tabs.Screen name="animal/[id]" options={{ href: null }} />
      <Tabs.Screen name="animal/edit" options={{ href: null }} />
      <Tabs.Screen name="animal/timeline" options={{ href: null }} />
      <Tabs.Screen name="animal/documents" options={{ href: null }} />
      <Tabs.Screen name="animal/share" options={{ href: null }} />
      <Tabs.Screen name="modals" options={{ href: null }} />
      <Tabs.Screen name="modals/add-animal" options={{ href: null }} />
      <Tabs.Screen name="modals/add-medical-event" options={{ href: null }} />
      <Tabs.Screen name="modals/add-reminder" options={{ href: null }} />
      <Tabs.Screen name="modals/upload-document" options={{ href: null }} />
      <Tabs.Screen name="modals/scan-document" options={{ href: null }} />
      <Tabs.Screen name="modals/view-document" options={{ href: null }} />
    </Tabs>
  );
}
