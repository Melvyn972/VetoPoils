import type { ExpoConfig } from "expo/config";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lmdszelnnibexzvnaubp.supabase.co";

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_wxfo-oDHdAFee8uSYP9Uxg_g41pInti";

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
  },
};

export default config;
