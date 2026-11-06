import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { pickDocumentFromDevice } from "@/features/documents/documents.service";
import { uploadAndAnalyzeDocument } from "@/features/documents/scan.service";
import { setPendingScanReview } from "@/features/documents/scanReview.store";
import { useSession } from "@/hooks/useSession";
import { isOcrConfigured } from "@/lib/env";
import { colors, typography } from "@/theme";
import { getErrorMessage } from "@/utils/errors";

export default function UploadDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, user } = useSession();
  const [loading, setLoading] = useState(false);
  const ocrReady = isOcrConfigured();

  const upload = async () => {
    if (!id || !profile?.id) return;

    const result = await pickDocumentFromDevice();
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setLoading(true);

    try {
      const analyzed = await uploadAndAnalyzeDocument({
        animalId: id,
        ownerId: profile.compte_proprietaire_id ?? profile.id,
        userId: user?.id,
        uri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
        size: asset.size ?? 1,
      });

      setPendingScanReview({
        animalId: id,
        document: analyzed.document,
        extraction: analyzed.extraction,
        ocrConfigured: ocrReady,
        ocrError: analyzed.ocrError,
      });
      router.replace({ pathname: "/(app)/modals/scan-review", params: { id } });
    } catch (error) {
      Alert.alert("Import impossible", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Importer un document</Text>
        <Text style={styles.subtitle}>
          PDF, ordonnance, analyse ou photo médicale. Une catégorie sera proposée
          {ocrReady ? " après lecture automatique" : " d’après le nom du fichier"} - vous pourrez la
          corriger.
        </Text>
      </View>
      <AppButton
        title={loading ? "Import en cours..." : "Choisir un fichier"}
        onPress={() => void upload()}
        disabled={loading}
      />
      <AppButton title="Annuler" variant="secondary" onPress={() => router.back()} disabled={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
  },
});
