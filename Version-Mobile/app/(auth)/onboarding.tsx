import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/theme";

export default function OnboardingScreen() {
  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.icon}>
          <MaterialCommunityIcons name="paw" size={44} color={colors.primary} />
        </View>
        <Text style={styles.title}>Vet'OPoil</Text>
        <Text style={styles.subtitle}>
          Le carnet de santé numérique de vos compagnons, toujours avec vous.
        </Text>
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Espace propriétaire</Text>
        <Text style={styles.text}>
          Centralisez animaux, documents médicaux, rappels et QR code de partage sécurisé.
        </Text>
      </AppCard>

      <View style={styles.actions}>
        <Link href="/(auth)/register" asChild>
          <AppButton title="Créer mon compte" />
        </Link>
        <Link href="/(auth)/login" asChild>
          <AppButton title="J'ai déjà un compte" variant="secondary" />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.xxl,
  },
  icon: {
    width: 92,
    height: 92,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.title,
    color: colors.primaryDark,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text,
  },
  text: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
});
