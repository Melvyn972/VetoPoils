import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

type ExtraConfig = {
  vetWebUrl?: string;
  vetWebProjectSlug?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
/** Incrémenter la clé pour invalider un ancien cache local. */
const VET_WEB_URL_CACHE_KEY = "vetopoil-vet-web-url-v3";
const PRODUCTION_VET_WEB_URL = "https://veto-poils.vercel.app";
const DEFAULT_VERCEL_PROJECT_SLUG = "veto-poils";
const LOCAL_HOST_PATTERN =
  /^(https?:\/\/)?(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|10\.\d+\.|172\.(1[6-9]|2\d|3[0-1])\.)/i;

function normalizeOrigin(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function isLocalDevUrl(value: string) {
  return LOCAL_HOST_PATTERN.test(value.trim());
}

function allowLocalVetWebUrl() {
  return process.env.EXPO_PUBLIC_VET_WEB_ALLOW_LOCAL === "1";
}

/**
 * Lit la config, mais ignore toute URL locale (sauf opt-in explicite).
 * Les QR codes doivent toujours pointer vers Vercel en usage normal.
 */
function getConfiguredPublicUrl(): string | null {
  const candidates = [
    process.env.EXPO_PUBLIC_VET_WEB_URL,
    process.env.NEXT_PUBLIC_VET_WEB_URL,
    extra.vetWebUrl,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;
    const origin = normalizeOrigin(value);
    if (isLocalDevUrl(origin) && !allowLocalVetWebUrl()) {
      continue;
    }
    return origin;
  }

  return null;
}

function getVercelProjectSlug() {
  return extra.vetWebProjectSlug?.trim() || DEFAULT_VERCEL_PROJECT_SLUG;
}

function getDefaultProductionVetWebUrl() {
  return PRODUCTION_VET_WEB_URL;
}

async function fetchDeployedVetWebUrl(): Promise<string | null> {
  const configUrl = `https://${getVercelProjectSlug()}.vercel.app/vet-portal-config.json`;
  try {
    const response = await fetch(configUrl);
    if (!response.ok) return null;

    const data = (await response.json()) as { baseUrl?: string };
    if (!data.baseUrl) return null;

    const origin = normalizeOrigin(data.baseUrl);
    if (isLocalDevUrl(origin)) return null;
    return origin;
  } catch {
    return null;
  }
}

/** URL synchrone pour les QR — toujours Vercel sauf opt-in local. */
export function getVetWebUrl() {
  return getConfiguredPublicUrl() ?? getDefaultProductionVetWebUrl();
}

/** Résolution async — purge le cache local et privilégie Vercel. */
export async function resolveVetWebUrl(): Promise<string> {
  const configured = getConfiguredPublicUrl();
  if (configured) {
    await AsyncStorage.setItem(VET_WEB_URL_CACHE_KEY, configured);
    return configured;
  }

  const cached = await AsyncStorage.getItem(VET_WEB_URL_CACHE_KEY);
  if (cached) {
    const normalized = normalizeOrigin(cached);
    if (!isLocalDevUrl(normalized) || allowLocalVetWebUrl()) {
      return normalized;
    }
    await AsyncStorage.removeItem(VET_WEB_URL_CACHE_KEY);
  }

  // Nettoyer aussi l'ancienne clé de cache
  await AsyncStorage.removeItem("vetopoil-vet-web-url-v2");

  const discovered = await fetchDeployedVetWebUrl();
  if (discovered) {
    await AsyncStorage.setItem(VET_WEB_URL_CACHE_KEY, discovered);
    return discovered;
  }

  return getDefaultProductionVetWebUrl();
}

export function buildVetConsultationUrl(token: string, baseUrl = getVetWebUrl()) {
  const origin = normalizeOrigin(baseUrl);
  // Garde-fou final : jamais encoder une IP locale dans un QR
  const safeOrigin =
    isLocalDevUrl(origin) && !allowLocalVetWebUrl()
      ? getDefaultProductionVetWebUrl()
      : origin;
  return `${safeOrigin}/consultation?token=${encodeURIComponent(token.trim())}`;
}

export function isVetAccessCode(value: string) {
  return /^[2-9A-HJ-NP-Z]{6}$/i.test(value.trim());
}
