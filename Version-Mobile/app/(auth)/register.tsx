import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Screen } from "@/components/ui/Screen";
import { signUp } from "@/features/auth/auth.service";
import { colors, spacing, typography } from "@/theme";
import { isEmail, isStrongEnoughPassword } from "@/utils/validators";

export default function RegisterScreen() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!prenom.trim() || !nom.trim()) {
      Alert.alert("Profil incomplet", "Prénom et nom sont obligatoires.");
      return;
    }

    if (!isEmail(email)) {
      Alert.alert("Email invalide", "Merci de saisir une adresse email valide.");
      return;
    }

    if (!isStrongEnoughPassword(password)) {
      Alert.alert("Mot de passe trop court", "Le CDC impose au moins 8 caractères.");
      return;
    }

    setLoading(true);
    const { error } = await signUp({
      email: email.trim(),
      password,
      prenom: prenom.trim(),
      nom: nom.trim(),
    });
    setLoading(false);

    if (error) {
      Alert.alert("Inscription impossible", error.message);
      return;
    }

    Alert.alert(
      "Compte créé",
      "Si la confirmation email est active, validez votre adresse avant connexion.",
    );
    router.replace("/(app)/dashboard");
  };

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Créer votre espace</Text>
        <Text style={styles.subtitle}>Un compte pour tous les dossiers de vos animaux.</Text>
      </View>

      <View style={styles.form}>
        <AppInput label="Prénom" value={prenom} onChangeText={setPrenom} />
        <AppInput label="Nom" value={nom} onChangeText={setNom} />
        <AppInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <AppInput
          label="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="8 caractères minimum"
        />
      </View>

      <AppButton
        title={loading ? "Création..." : "Créer mon compte"}
        onPress={submit}
        disabled={loading}
      />

      <Link href="/(auth)/login" style={styles.link}>
        J'ai déjà un compte
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
