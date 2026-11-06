import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AnimalCard } from "@/components/animal/AnimalCard";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { useAnimals } from "@/hooks/useAnimals";
import { colors, spacing, typography } from "@/theme";

export default function AnimalsScreen() {
  const { animals } = useAnimals();

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes animaux</Text>
          <Text style={styles.subtitle}>Gérez les carnets de santé de vos compagnons.</Text>
        </View>
      </View>

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

      <AppButton title="Ajouter un animal" onPress={() => router.push("/(app)/modals/add-animal")} />
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
  list: {
    gap: spacing.md,
  },
});
