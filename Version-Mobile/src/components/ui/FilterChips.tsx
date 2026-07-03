import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "@/theme";

export type ChipOption<T extends string> = {
  label: string;
  value: T;
};

type FilterChipsProps<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, active && styles.active]}
          >
            <Text style={[styles.text, active && styles.activeText]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    color: colors.textMuted,
    fontWeight: "800",
  },
  activeText: {
    color: colors.white,
  },
});
