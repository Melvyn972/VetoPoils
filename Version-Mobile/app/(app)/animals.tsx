import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AnimalCard } from "@/components/animal/AnimalCard";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { useAnimals } from "@/hooks/useAnimals";
import { useSession } from "@/hooks/useSession";
import { colors, radius, spacing, typography } from "@/theme";

export default function AnimalsScreen() {
  const { animals } = useAnimals();
  const { profile } = useSession();
  const isFreeLimited = profile?.plan === "free" && animals.length >= 1;

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes animaux</Text>
          <Text style={styles.subtitle}>Gérez les carnets de santé de vos compagnons.</Text>
        </View>
      </View>

      <AppCard style={styles.planCard}>
        <View style={styles.planIcon}>
          <MaterialCommunityIcons name="crown-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.planContent}>
          <Text style={styles.planTitle}>Plan {profile?.plan ?? "free"}</Text>
          <Text style={styles.planText}>
            {profile?.plan === "premium"
              ? "Animaux illimités et fonctions avancées."
              : "1 animal inclus. Premium débloquera le multi-animaux illimité."}
          </Text>
        </View>
      </AppCard>

      {animals.length === 0 ? (
        <EmptyState
          icon="paw"
          title="Aucun animal"
          description="Ajoutez votre premier animal pour créer son dossier."
        />
      ) : (
        <View style={styles.list}>
          {animals.map((animal) => (
            <AppCard key={animal.id}>
              <AnimalCard
                animal={animal}
                onPress={() => router.push(`/(app)/animal/${animal.id}`)}
              />
            </AppCard>
          ))}
        </View>
      )}

      <AppButton
        title={isFreeLimited ? "Premium requis pour ajouter" : "Ajouter un animal"}
        disabled={isFreeLimited}
        onPress={() => router.push("/(app)/modals/add-animal")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  planContent: {
    flex: 1,
  },
  planTitle: {
    ...typography.cardTitle,
    color: colors.text,
    textTransform: "capitalize",
  },
  planText: {
    color: colors.textMuted,
  },
  list: {
    gap: spacing.md,
  },
});
