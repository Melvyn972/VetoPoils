import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";

import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";
import type { Animal } from "@/types/database.types";

export function AnimalAvatar({ animal, size = 58 }: { animal?: Animal; size?: number }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPhoto() {
      if (!animal?.photo_path) {
        setSignedUrl(null);
        return;
      }

      const { data, error } = await supabase.storage
        .from("animal-photos")
        .createSignedUrl(animal.photo_path, 60 * 60);

      if (mounted) setSignedUrl(error ? null : data?.signedUrl ?? null);
    }

    loadPhoto();

    return () => {
      mounted = false;
    };
  }, [animal?.photo_path]);

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {signedUrl ? (
        <Image source={{ uri: signedUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      ) : (
        <Text style={[styles.text, { fontSize: size * 0.36 }]}>
          {animal?.nom?.slice(0, 1).toUpperCase() ?? "🐾"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: "hidden",
  },
  text: {
    fontWeight: "900",
    color: colors.primaryDark,
  },
});
