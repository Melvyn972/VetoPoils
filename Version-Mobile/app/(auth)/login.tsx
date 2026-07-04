import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Screen } from "@/components/ui/Screen";
import { signIn } from "@/features/auth/auth.service";
import { colors, spacing, typography } from "@/theme";
import { isEmail } from "@/utils/validators";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isEmail(email)) {
      Alert.alert("Email invalide", "Merci de saisir une adresse email valide.");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert("Connexion impossible", error.message);
      return;
    }

    router.replace("/(app)/dashboard");
  };

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Bon retour</Text>
        <Text style={styles.subtitle}>Connectez-vous à votre carnet Vet'OPoil.</Text>
      </View>

      <View style={styles.form}>
        <AppInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="marie@email.fr"
        />
        <AppInput
          label="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Minimum 8 caractères"
        />
      </View>

      <AppButton
        title={loading ? "Connexion..." : "Se connecter"}
        onPress={submit}
        disabled={loading}
      />

      <Link href="/(auth)/register" style={styles.link}>
        Créer un compte
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  form: {
    gap: spacing.md,
  },
  link: {
    textAlign: "center",
    color: colors.primary,
    fontWeight: "800",
  },
});
