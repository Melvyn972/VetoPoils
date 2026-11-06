import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { AppCard } from "@/components/ui/AppCard";
import { useVetWebUrl } from "@/hooks/useVetWebUrl";
import { buildVetConsultationUrl, isVetAccessCode } from "@/lib/vetWeb";
import { colors, spacing, typography } from "@/theme";
import type { VetAccessToken } from "@/types/database.types";
import { formatCountdown, formatDate } from "@/utils/dates";

export function QrCodeCard({ token }: { token: VetAccessToken }) {
  const { url: vetWebUrl, isResolving } = useVetWebUrl();
  const url = buildVetConsultationUrl(token.token, vetWebUrl);
  const accessCode = token.token.trim().toUpperCase();
  const hasShortCode = isVetAccessCode(accessCode);
  const [countdown, setCountdown] = useState(() => formatCountdown(token.expire_le));

  useEffect(() => {
    setCountdown(formatCountdown(token.expire_le));
    const timer = setInterval(() => {
      setCountdown(formatCountdown(token.expire_le));
    }, 1000);
    return () => clearInterval(timer);
  }, [token.expire_le]);

  const expired = countdown === "Expiré";

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
        Usage unique · Valable jusqu'au {formatDate(token.expire_le)}. À partager uniquement
        pendant la consultation.
      </Text>
      <Text style={[styles.countdown, expired && styles.countdownExpired]}>
        {expired ? "Ce code a expiré" : `Expire dans ${countdown}`}
      </Text>
      {hasShortCode ? (
        <Text selectable style={styles.code}>
          {accessCode}
        </Text>
      ) : (
        <Text style={styles.legacyWarning}>
          Ce code n'est pas au format 6 caractères. Générez-en un nouveau.
        </Text>
      )}
      <Text selectable style={styles.url}>
        {url}
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
  countdown: {
    color: colors.primaryDark,
    fontWeight: "800",
    textAlign: "center",
  },
  countdownExpired: {
    color: colors.accent,
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
