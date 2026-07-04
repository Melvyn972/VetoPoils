import { Platform } from "react-native";

import { colors } from "@/theme/colors";

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
};
