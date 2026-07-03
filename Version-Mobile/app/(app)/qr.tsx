import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AnimalSelector } from "@/components/animal/AnimalSelector";
import { QrCodeCard } from "@/components/qr/QrCodeCard";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { generateVetToken, revokeVetToken } from "@/features/qr/qr.service";
import { useAnimals } from "@/hooks/useAnimals";
import { colors, spacing, typography } from "@/theme";
import type { VetAccessToken } from "@/types/database.types";
import { getErrorMessage } from "@/utils/errors";

export default function QrScreen() {
  const { animals, selectedAnimal, selectedAnimalId, setSelectedAnimalId } = useAnimals();
  const [token, setToken] = useState<VetAccessToken | null>(null);
  const [loading, setLoading] = useState(false);

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
    <Screen style={styles.screen}>
      <View>
        <Text style={styles.title}>QR Code</Text>
        <Text style={styles.subtitle}>
          Générez un accès temporaire de 4h pour le vétérinaire. L’app mobile ne contient pas
          l’espace vétérinaire.
        </Text>
      </View>

      {animals.length > 0 ? (
        <AnimalSelector
          animals={animals}
          selectedId={selectedAnimalId}
          onSelect={(animal) => {
            setSelectedAnimalId(animal.id);
            setToken(null);
          }}
        />
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
            Le code permet au vétérinaire de consulter le dossier via le parcours web dédié,
            pendant la durée limitée prévue par le CDC.
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
