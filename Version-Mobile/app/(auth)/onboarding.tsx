import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/theme";

const highlights = [
  {
    icon: "file-document-outline" as const,
    title: "Carnet & scan",
    text: "Photos, PDF et historique médical, avec suggestion de classement.",
  },
  {
    icon: "qrcode" as const,
    title: "QR vétérinaire",
    text: "Code temporaire 6 caractères, usage unique, révocable à tout moment.",
  },
  {
    icon: "cash-multiple" as const,
    title: "Budget & score",
    text: "Suivi des frais et score santé calculé à partir du carnet.",
  },
];

export default function OnboardingScreen() {
  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.icon} accessibilityLabel="Vet'OPoil">
          <MaterialCommunityIcons name="paw" size={44} color={colors.primary} />
        </View>
        <Text style={styles.title}>Vet'OPoil</Text>
        <Text style={styles.subtitle}>
          Le carnet de santé numérique de vos compagnons, toujours avec vous.
        </Text>
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Espace propriétaire</Text>
        <View style={styles.highlights}>
          {highlights.map((item) => (
            <View key={item.title} style={styles.highlight}>
              <View style={styles.highlightIcon}>
                <MaterialCommunityIcons name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.highlightText}>
                <Text style={styles.highlightTitle}>{item.title}</Text>
                <Text style={styles.text}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>
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
  highlights: {
    gap: spacing.md,
  },
  highlight: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightText: {
    flex: 1,
    gap: 2,
  },
  highlightTitle: {
    fontWeight: "800",
    color: colors.text,
  },
  text: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
  },
});
