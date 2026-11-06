import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { fetchSuggestedPartners, openPartner } from "@/features/partners/partners.service";
import { useSession } from "@/hooks/useSession";
import { colors, radius, spacing, typography } from "@/theme";
import type { Animal, Partner } from "@/types/database.types";

type PartnerSuggestionsProps = {
  animal?: Pick<Animal, "espece" | "race"> | null;
  contexte: string;
};

export function PartnerSuggestions({ animal, contexte }: PartnerSuggestionsProps) {
  const { user } = useSession();
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    if (!animal) {
      setPartners([]);
      return;
    }

    void fetchSuggestedPartners(animal)
      .then(setPartners)
      .catch(() => setPartners([]));
  }, [animal]);

  if (!animal || partners.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.kicker}>Suggestions partenaires</Text>
      <Text style={styles.hint}>Liens utiles, sans publicité intrusive - ouverture dans le navigateur.</Text>
      {partners.map((partner) => (
        <Pressable
          key={partner.id}
          style={styles.row}
          accessibilityRole="link"
          accessibilityLabel={`Ouvrir ${partner.nom}`}
          onPress={() => {
            void openPartner({ partner, userId: user?.id, contexte }).catch(() => {
              void Linking.openURL(partner.url);
            });
          }}
        >
          <View style={styles.icon}>
            <MaterialCommunityIcons name="storefront-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.content}>
            <Text style={styles.name}>{partner.nom}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {partner.description ?? partner.categorie}
            </Text>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  kicker: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: "800",
    color: colors.text,
  },
  description: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
