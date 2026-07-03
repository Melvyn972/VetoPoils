import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { colors, radius, spacing, typography } from "@/theme";
import type { Document } from "@/types/database.types";
import { formatDate } from "@/utils/dates";

export function DocumentCard({ document }: { document: Document }) {
  const openDocument = () => {
    router.push({
      pathname: "/(app)/modals/view-document",
      params: {
        filePath: document.file_path,
        fileName: document.file_name,
        mimeType: document.mime_type,
      },
    });
  };

  return (
    <Pressable onPress={openDocument}>
      <AppCard style={styles.card}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{document.file_name}</Text>
        <Text style={styles.meta}>{formatDate(document.created_at)}</Text>
        <Badge label={document.category_ocr ?? "non classé"} tone="info" />
      </View>
        <MaterialCommunityIcons name="eye-outline" size={20} color={colors.textMuted} />
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.cardTitle,
    color: colors.text,
  },
  meta: {
    color: colors.textMuted,
  },
});
