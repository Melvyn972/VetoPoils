import { Text, TextInput, TextInputProps, StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius, spacing } from "@/theme";

type AppInputProps = TextInputProps & {
  label: string;
  containerStyle?: ViewStyle;
};

export function AppInput({ label, style, containerStyle, ...props }: AppInputProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 15,
  },
});
