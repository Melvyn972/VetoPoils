import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnimalAvatar } from "@/components/animal/AnimalAvatar";
import { Badge } from "@/components/ui/Badge";
import { colors, spacing, typography } from "@/theme";
import type { Animal } from "@/types/database.types";
import { formatDate } from "@/utils/dates";

type AnimalCardProps = {
  animal: Animal;
  onPress?: () => void;
};

export function AnimalCard({ animal, onPress }: AnimalCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="button" accessibilityLabel={animal.nom}>
      <AnimalAvatar animal={animal} />
      <View style={styles.content}>
        <Text style={styles.name}>{animal.nom}</Text>
        <Text style={styles.meta}>
          {animal.espece}
          {animal.race ? ` • ${animal.race}` : ""}
        </Text>
        <Text style={styles.meta}>
          {animal.date_naissance ? `Né le ${formatDate(animal.date_naissance)}` : "Date de naissance à compléter"}
        </Text>
      </View>
      <Badge
        label={animal.score_sante == null ? "Nouveau" : `${animal.score_sante}/100`}
        tone={animal.score_sante != null && animal.score_sante < 60 ? "warning" : "success"}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.cardTitle,
    color: colors.text,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
