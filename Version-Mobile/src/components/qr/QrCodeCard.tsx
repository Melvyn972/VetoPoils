import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { AppCard } from "@/components/ui/AppCard";
import { colors, spacing, typography } from "@/theme";
import type { VetAccessToken } from "@/types/database.types";
import { formatDate } from "@/utils/dates";

export function QrCodeCard({ token }: { token: VetAccessToken }) {
  const url = `vetopoil://vet-session/${token.token}`;

  return (
    <AppCard style={styles.card}>
      <View style={styles.qrBox}>
        <QRCode value={url} size={210} color={colors.primaryDark} backgroundColor={colors.white} />
      </View>
      <Text style={styles.title}>Code unique vétérinaire</Text>
      <Text style={styles.description}>
        Valable jusqu'au {formatDate(token.expire_le)}. À partager uniquement pendant la consultation.
      </Text>
      <Text selectable style={styles.token}>
        {token.token}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
  },
  qrBox: {
    padding: spacing.lg,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
  },
  description: {
    color: colors.textMuted,
    textAlign: "center",
  },
  token: {
    color: colors.primaryDark,
    fontSize: 12,
    textAlign: "center",
  },
});
