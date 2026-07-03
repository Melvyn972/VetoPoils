import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { AnimalAvatar } from "@/components/animal/AnimalAvatar";
import { colors, radius, spacing } from "@/theme";
import type { Animal } from "@/types/database.types";

type AnimalSelectorProps = {
  animals: Animal[];
  selectedId?: string | null;
  onSelect: (animal: Animal) => void;
  onItemPress?: (animal: Animal) => void;
};

export function AnimalSelector({ animals, selectedId, onSelect, onItemPress }: AnimalSelectorProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {animals.map((animal) => {
        const active = animal.id === selectedId;
        return (
          <Pressable
            key={animal.id}
            onPress={() => {
              onSelect(animal);
              onItemPress?.(animal);
            }}
            style={[styles.item, active && styles.active]}
          >
            <AnimalAvatar animal={animal} size={52} />
            <Text style={[styles.name, active && styles.activeName]}>{animal.nom}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    gap: spacing.xs,
    marginRight: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.lg,
  },
  active: {
    backgroundColor: colors.primarySoft,
  },
  name: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  activeName: {
    color: colors.primaryDark,
  },
});
