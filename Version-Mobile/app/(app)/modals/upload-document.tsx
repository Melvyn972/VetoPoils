import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import {
  createDocumentMetadata,
  pickDocumentFromDevice,
} from "@/features/documents/documents.service";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabase";
import { buildAnimalStoragePath } from "@/lib/storagePaths";
import { colors, typography } from "@/theme";
import { getErrorMessage } from "@/utils/errors";

export default function UploadDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useSession();
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!id || !profile?.id) return;

    const result = await pickDocumentFromDevice();
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setLoading(true);

    try {
      const path = buildAnimalStoragePath({
        ownerId: profile.compte_proprietaire_id ?? profile.id,
        animalId: id,
        fileName: asset.name,
      });
      const response = await fetch(asset.uri);
      const fileBody = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("animal-documents")
        .upload(path, fileBody, {
          contentType: asset.mimeType ?? "application/octet-stream",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      await createDocumentMetadata({
        animal_id: id,
        file_path: path,
        file_name: asset.name,
        mime_type: asset.mimeType ?? "application/octet-stream",
        taille_octets: asset.size ?? 1,
        category_ocr: null,
      });

      router.back();
    } catch (error) {
      Alert.alert("Upload impossible", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Uploader un document</Text>
        <Text style={styles.subtitle}>PDF, ordonnance, analyse ou photo médicale.</Text>
      </View>
      <AppButton title={loading ? "Upload..." : "Choisir un fichier"} onPress={upload} disabled={loading} />
      <AppButton title="Annuler" variant="secondary" onPress={() => router.back()} />
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
  },
});
