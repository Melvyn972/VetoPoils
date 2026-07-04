import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ImagePickerAsset } from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import {
  createDocumentMetadata,
  incrementOcrUsage,
  pickImageFromCamera,
  pickImageFromLibrary,
} from "@/features/documents/documents.service";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabase";
import { buildAnimalStoragePath } from "@/lib/storagePaths";
import { colors, radius, spacing, typography } from "@/theme";
import { getErrorMessage } from "@/utils/errors";

async function uploadScannedImage(params: {
  animalId: string;
  ownerId: string;
  asset: ImagePickerAsset;
}) {
  await incrementOcrUsage();

  const fileName = params.asset.fileName ?? `scan-${Date.now()}.jpg`;
  const path = buildAnimalStoragePath({
    ownerId: params.ownerId,
    animalId: params.animalId,
    fileName,
  });
  const response = await fetch(params.asset.uri);
  const fileBody = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("animal-documents")
    .upload(path, fileBody, {
      contentType: params.asset.mimeType ?? "image/jpeg",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  await createDocumentMetadata({
    animal_id: params.animalId,
    file_path: path,
    file_name: fileName,
    mime_type: params.asset.mimeType ?? "image/jpeg",
    taille_octets: params.asset.fileSize ?? 1,
    category_ocr: "autre",
  });
}

export default function ScanDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useSession();
  const [loading, setLoading] = useState(false);

  const processScan = async (source: "camera" | "library") => {
    if (!id || !profile?.id) return;

    setLoading(true);
    try {
      const result =
        source === "camera" ? await pickImageFromCamera() : await pickImageFromLibrary();

      if (result.canceled || !result.assets[0]) return;

      await uploadScannedImage({
        animalId: id,
        ownerId: profile.compte_proprietaire_id ?? profile.id,
        asset: result.assets[0],
      });

      Alert.alert("Scan enregistré", "L'analyse OCR backend pourra compléter les champs extraits.");
      router.back();
    } catch (error) {
      Alert.alert("Scan impossible", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Scan OCR</Text>
        <Text style={styles.subtitle}>
          Cadrez le document médical avec la caméra pour une lecture optimale.
        </Text>
      </View>
      <View style={styles.viewfinder}>
        <MaterialCommunityIcons name="camera-outline" size={96} color={colors.primary} />
        <Text style={styles.hint}>Placez le document dans le cadre</Text>
      </View>
      <View style={styles.actions}>
        <AppButton
          title={loading ? "Analyse..." : "Prendre une photo"}
          onPress={() => processScan("camera")}
          disabled={loading}
        />
        <AppButton
          title="Choisir depuis la galerie"
          variant="secondary"
          onPress={() => processScan("library")}
          disabled={loading}
        />
        <AppButton title="Annuler" variant="secondary" onPress={() => router.back()} />
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
