import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import {
  getDocumentSignedUrl,
  getPdfViewerUrl,
  isImageDocument,
} from "@/features/documents/documents.service";
import { colors, radius, spacing, typography } from "@/theme";
import { getErrorMessage } from "@/utils/errors";

export default function ViewDocumentScreen() {
  const { filePath, fileName, mimeType } = useLocalSearchParams<{
    filePath: string;
    fileName: string;
    mimeType: string;
  }>();
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isImage = isImageDocument(mimeType);

  useEffect(() => {
    if (!filePath) {
      setError("Document introuvable.");
      setLoading(false);
      return;
    }

    let mounted = true;

    getDocumentSignedUrl(filePath)
      .then((signedUrl) => {
        if (!mounted) return;
        setViewerUrl(isImage ? signedUrl : getPdfViewerUrl(signedUrl));
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [filePath, isImage]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>
            {fileName ?? "Document"}
          </Text>
          <Text style={styles.subtitle}>{isImage ? "Image" : "PDF"}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement du document...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="file-alert-outline" size={42} color={colors.danger} />
          <Text style={styles.errorTitle}>Ouverture impossible</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Retour</Text>
          </Pressable>
        </View>
      ) : isImage && viewerUrl ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.imageContainer}
          maximumZoomScale={3}
          minimumZoomScale={1}
          centerContent
        >
          <Image source={{ uri: viewerUrl }} style={styles.image} contentFit="contain" />
        </ScrollView>
      ) : viewerUrl ? (
        <WebView
          source={{ uri: viewerUrl }}
          style={styles.flex}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.cardTitle,
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  errorTitle: {
    ...typography.heading,
    color: colors.text,
  },
  errorText: {
    color: colors.textMuted,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryText: {
    color: colors.white,
    fontWeight: "900",
  },
  imageContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  image: {
    width: "100%",
    minHeight: 420,
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
