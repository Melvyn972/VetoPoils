import Constants from "expo-constants";

type ExtraConfig = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const env = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    extra.supabaseUrl ??
    "https://lmdszelnnibexzvnaubp.supabase.co",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    extra.supabasePublishableKey ??
    "sb_publishable_wxfo-oDHdAFee8uSYP9Uxg_g41pInti",
};
