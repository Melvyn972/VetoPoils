import type { TextStyle } from "react-native";

export const typography = {
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.6,
  } satisfies TextStyle,
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  } satisfies TextStyle,
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  } satisfies TextStyle,
};
