import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { AppCard } from "@/components/ui/AppCard";
import { useVetWebUrl } from "@/hooks/useVetWebUrl";
import { buildVetConsultationUrl, isVetAccessCode } from "@/lib/vetWeb";
import { colors, spacing, typography } from "@/theme";
import type { VetAccessToken } from "@/types/database.types";
import { formatDate } from "@/utils/dates";

export function QrCodeCard({ token }: { token: VetAccessToken }) {
  const { url: vetWebUrl, isResolving } = useVetWebUrl();
  const url = buildVetConsultationUrl(token.token, vetWebUrl);
  const accessCode = token.token.trim().toUpperCase();
  const hasShortCode = isVetAccessCode(accessCode);

  return (
    <AppCard style={styles.card}>
      <View style={styles.qrBox}>
        {isResolving ? (
          <Text style={styles.resolving}>Préparation du QR...</Text>
        ) : (
          <QRCode value={url} size={210} color={colors.primaryDark} backgroundColor={colors.white} />
        )}
      </View>
      <Text style={styles.title}>Code unique vétérinaire</Text>
      <Text style={styles.description}>
        Valable jusqu'au {formatDate(token.expire_le)}. À partager uniquement pendant la consultation.
      </Text>
      {hasShortCode ? (
        <Text selectable style={styles.code}>
          {accessCode}
        </Text>
      ) : (
        <Text style={styles.legacyWarning}>
          Exécutez supabase/fix_vet_access_code_6_chars.sql dans le SQL Editor Supabase pour activer les
          codes à 6 caractères.
        </Text>
      )}
      <Text selectable style={styles.url}>
        {vetWebUrl}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
  },
  qrBox: {
    width: 242,
    height: 242,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resolving: {
    color: colors.textMuted,
    textAlign: "center",
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
  code: {
    color: colors.primaryDark,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 6,
    textAlign: "center",
  },
  legacyWarning: {
    color: colors.accent,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  url: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
});
