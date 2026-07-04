import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AnimalAvatar } from "@/components/animal/AnimalAvatar";
import { QrCodeCard } from "@/components/qr/QrCodeCard";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { generateVetToken, revokeVetToken } from "@/features/qr/qr.service";
import { useAnimals } from "@/hooks/useAnimals";
import { colors, radius, spacing, typography } from "@/theme";
import type { VetAccessToken } from "@/types/database.types";
import { getErrorMessage } from "@/utils/errors";

export default function QrScreen() {
  const { animals, selectedAnimal, selectedAnimalId, setSelectedAnimalId, refresh } = useAnimals();
  const [token, setToken] = useState<VetAccessToken | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const generate = async () => {
    if (!selectedAnimalId) return;
    setLoading(true);
    try {
      setToken(await generateVetToken(selectedAnimalId, 4));
    } catch (error) {
      Alert.alert("QR impossible", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const revoke = async () => {
    if (!token) return;
    await revokeVetToken(token.token);
    setToken(null);
  };

  return (
    <Screen style={styles.screen} scroll>
      <View>
        <Text style={styles.title}>QR Code</Text>
        <Text style={styles.subtitle}>
          Générez un accès temporaire de 4h pour le vétérinaire. Chaque code QR est utilisable une
          seule fois lors d'une consultation.
        </Text>
      </View>

      {animals.length > 0 ? (
        <View style={styles.pickerSection}>
          <Text style={styles.pickerTitle}>Choisissez un animal ({animals.length})</Text>
          <View style={styles.animalGrid}>
            {animals.map((animal) => {
              const active = animal.id === selectedAnimalId;
              return (
                <Pressable
                  key={animal.id}
                  style={[styles.animalCard, active && styles.animalCardActive]}
                  onPress={() => {
                    setSelectedAnimalId(animal.id);
                    setToken(null);
                  }}
                >
                  <AnimalAvatar animal={animal} size={56} />
                  <Text style={[styles.animalName, active && styles.animalNameActive]} numberOfLines={1}>
                    {animal.nom}
                  </Text>
                  <Text style={styles.animalMeta} numberOfLines={1}>
                    {animal.espece}
                    {animal.race ? ` · ${animal.race}` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <EmptyState
          icon="paw-outline"
          title="Aucun animal"
          description="Ajoutez un animal avant de générer un code unique."
        />
      )}

      {selectedAnimal ? (
        <AppCard>
          <Text style={styles.cardTitle}>Accès pour {selectedAnimal.nom}</Text>
          <Text style={styles.text}>
            Le code permet au vétérinaire de consulter le dossier et rédiger une consultation. Une
            fois utilisé, il ne pourra plus être réemployé — générez-en un nouveau si besoin.
          </Text>
        </AppCard>
      ) : null}

      {token ? <QrCodeCard token={token} /> : null}

      {token ? (
        <AppButton title="Révoquer le code" variant="danger" onPress={revoke} />
      ) : (
        <AppButton
          title={loading ? "Génération..." : "Générer le QR code"}
          onPress={generate}
          disabled={!selectedAnimalId || loading}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 110,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  pickerSection: {
    gap: spacing.md,
  },
  pickerTitle: {
    ...typography.heading,
    color: colors.text,
  },
  animalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  animalCard: {
    width: "47%",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  animalCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  animalName: {
    fontWeight: "800",
    color: colors.text,
    fontSize: 14,
    textAlign: "center",
  },
  animalNameActive: {
    color: colors.primaryDark,
  },
  animalMeta: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
  cardTitle: {
    ...typography.cardTitle,
    color: colors.text,
  },
  text: {
    color: colors.textMuted,
    lineHeight: 22,
  },
});
