import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

type ExtraConfig = {
  vetWebUrl?: string;
  vetWebProjectSlug?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
const VET_WEB_URL_CACHE_KEY = "vetopoil-vet-web-url-v2";
const TUNNEL_HOST_PATTERN = /(exp\.direct|expo\.dev|ngrok)/i;
const PRODUCTION_VET_WEB_URL = "https://veto-poils.vercel.app";
const DEFAULT_VERCEL_PROJECT_SLUG = "veto-poils";

function getExpoDevHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const host = hostUri.split(":")[0];
  if (!host || TUNNEL_HOST_PATTERN.test(host)) {
    return null;
  }

  return host;
}

function getDevVetWebUrl(): string {
  const host = getExpoDevHost();
  if (host) {
    return `http://${host}:5173`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5173";
  }

  return "http://localhost:5173";
}

function normalizeOrigin(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function getExplicitVetWebUrl(): string | null {
  const configured =
    process.env.EXPO_PUBLIC_VET_WEB_URL?.trim() ||
    extra.vetWebUrl?.trim() ||
    process.env.NEXT_PUBLIC_VET_WEB_URL?.trim();

  return configured ? normalizeOrigin(configured) : null;
}

function getVercelProjectSlug() {
  return extra.vetWebProjectSlug?.trim() || DEFAULT_VERCEL_PROJECT_SLUG;
}

function getDefaultProductionVetWebUrl() {
  return PRODUCTION_VET_WEB_URL;
}

function getDiscoveryConfigUrls() {
  const slug = getVercelProjectSlug();
  return [`https://${slug}.vercel.app/vet-portal-config.json`];
}

async function fetchDeployedVetWebUrl(): Promise<string | null> {
  for (const configUrl of getDiscoveryConfigUrls()) {
    try {
      const response = await fetch(configUrl);
      if (!response.ok) continue;

      const data = (await response.json()) as { baseUrl?: string };
      if (data.baseUrl) {
        return normalizeOrigin(data.baseUrl);
      }
    } catch {
      // Essayer l'URL de découverte suivante.
    }
  }

  return null;
}

/** URL synchrone — dev local ou override explicite. */
export function getVetWebUrl() {
  const explicit = getExplicitVetWebUrl();
  if (explicit) return explicit;

  if (__DEV__) {
    return getDevVetWebUrl();
  }

  return getDefaultProductionVetWebUrl();
}

/** Résolution complète — inclut la découverte automatique du domaine Vercel. */
export async function resolveVetWebUrl(): Promise<string> {
  const explicit = getExplicitVetWebUrl();
  if (explicit) return explicit;

  if (__DEV__) {
    return getDevVetWebUrl();
  }

  const cached = await AsyncStorage.getItem(VET_WEB_URL_CACHE_KEY);
  if (cached) {
    return normalizeOrigin(cached);
  }

  const discovered = await fetchDeployedVetWebUrl();
  if (discovered) {
    await AsyncStorage.setItem(VET_WEB_URL_CACHE_KEY, discovered);
    return discovered;
  }

  return getDefaultProductionVetWebUrl();
}

export function buildVetConsultationUrl(token: string, baseUrl = getVetWebUrl()) {
  return `${baseUrl}/consultation?token=${encodeURIComponent(token)}`;
}

export function isVetAccessCode(value: string) {
  return /^[2-9A-HJ-NP-Z]{6}$/i.test(value.trim());
}
