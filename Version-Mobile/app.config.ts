import type { ExpoConfig } from "expo/config";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lmdszelnnibexzvnaubp.supabase.co";

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_wxfo-oDHdAFee8uSYP9Uxg_g41pInti";

function resolveVetWebUrlFromVercel() {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    return production.startsWith("http") ? production : `https://${production}`;
  }

  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) {
    return deployment.startsWith("http") ? deployment : `https://${deployment}`;
  }

  return undefined;
}

function isLocalDevUrl(value: string) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|10\.\d+\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(
    value.trim(),
  );
}

function resolveVetWebUrlForQr() {
  const candidates = [
    process.env.EXPO_PUBLIC_VET_WEB_URL?.trim(),
    process.env.NEXT_PUBLIC_VET_WEB_URL?.trim(),
    resolveVetWebUrlFromVercel(),
  ];

  const allowLocal = process.env.EXPO_PUBLIC_VET_WEB_ALLOW_LOCAL === "1";

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (isLocalDevUrl(candidate) && !allowLocal) continue;
    return candidate.startsWith("http") ? candidate.replace(/\/$/, "") : `https://${candidate}`;
  }

  return "https://veto-poils.vercel.app";
}

const vetWebUrl = resolveVetWebUrlForQr();

const vetWebProjectSlug = "veto-poils";

const config: ExpoConfig = {
  name: "Vet'OPoil",
  slug: "vetopoil-mobile",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "vetopoil",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#F7F6F2",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.vetopoil.mobile",
  },
  android: {
    package: "com.vetopoil.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#F7F6F2",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-notifications",
    "@react-native-community/datetimepicker",
    [
      "expo-image-picker",
      {
        cameraPermission:
          "Autorisez Vet'OPoil à utiliser la caméra pour scanner vos documents médicaux.",
        photosPermission:
          "Autorisez Vet'OPoil à accéder à vos photos pour importer des documents.",
      },
    ],
  ],
  extra: {
    supabaseUrl,
    supabasePublishableKey,
    vetWebUrl,
    vetWebProjectSlug,
  },
};

export default config;
