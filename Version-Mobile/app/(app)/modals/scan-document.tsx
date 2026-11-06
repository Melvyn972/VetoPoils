import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { pickImageFromCamera, pickImageFromLibrary } from "@/features/documents/documents.service";
import { uploadAndAnalyzeDocument } from "@/features/documents/scan.service";
import { setPendingScanReview } from "@/features/documents/scanReview.store";
import { useSession } from "@/hooks/useSession";
import { isOcrConfigured } from "@/lib/env";
import { colors, radius, spacing, typography } from "@/theme";
import { getErrorMessage } from "@/utils/errors";

export default function ScanDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, user } = useSession();
  const [loading, setLoading] = useState(false);
  const ocrReady = isOcrConfigured();

  const processScan = async (source: "camera" | "library") => {
    if (!id || !profile?.id) return;

    setLoading(true);
    try {
      const result =
        source === "camera"
          ? await pickImageFromCamera({ includeBase64: ocrReady })
          : await pickImageFromLibrary({ includeBase64: ocrReady });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const analyzed = await uploadAndAnalyzeDocument({
        animalId: id,
        ownerId: profile.compte_proprietaire_id ?? profile.id,
        userId: user?.id,
        uri: asset.uri,
        fileName: asset.fileName ?? `scan-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
        size: asset.fileSize ?? 1,
        base64: asset.base64,
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
      Alert.alert("Scan impossible", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Photographier un document</Text>
        <Text style={styles.subtitle}>
          {ocrReady
            ? "Cadrez l’ordonnance, la facture ou l’analyse. La lecture automatique proposera une catégorie et des champs à vérifier."
            : "Cadrez le document pour l’ajouter au dossier. La lecture automatique (OCR) n’est pas configurée : vous classerez ensuite le fichier à la main."}
        </Text>
      </View>
      <View style={styles.viewfinder} accessibilityLabel="Cadre de prise de vue">
        <MaterialCommunityIcons name="camera-outline" size={96} color={colors.primary} />
        <Text style={styles.hint}>Placez le document dans le cadre</Text>
      </View>
      <View style={styles.actions}>
        <AppButton
          title={loading ? "Analyse..." : "Prendre une photo"}
          onPress={() => void processScan("camera")}
          disabled={loading}
        />
        <AppButton
          title="Choisir depuis la galerie"
          variant="secondary"
          onPress={() => void processScan("library")}
          disabled={loading}
        />
        <AppButton title="Annuler" variant="secondary" onPress={() => router.back()} disabled={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: colors.black,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.white,
  },
  subtitle: {
    color: "#B8C7C3",
    lineHeight: 20,
  },
  viewfinder: {
    alignSelf: "center",
    width: 260,
    height: 360,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  hint: {
    color: "#B8C7C3",
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
});
