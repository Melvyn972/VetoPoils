import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Screen } from "@/components/ui/Screen";
import { createAnimal, uploadAnimalPhoto } from "@/features/animals/animals.service";
import { createMedicalEvent } from "@/features/medical/medical.service";
import { useSession } from "@/hooks/useSession";
import { colors, radius, spacing, typography } from "@/theme";
import { getErrorMessage } from "@/utils/errors";

const speciesOptions = ["Chien", "Chat", "Lapin", "Oiseau", "Rongeur", "Reptile", "Autre"];
const sexOptions = [
  { label: "Mâle", value: "male" },
  { label: "Femelle", value: "femelle" },
  { label: "Inconnu", value: "inconnu" },
] as const;

function formatBirthDate(date: Date | null) {
  if (!date) return "Sélectionner une date";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatComputedAge(date: Date | null) {
  if (!date) return "Renseigné automatiquement";

  const today = new Date();
  let years = today.getFullYear() - date.getFullYear();
  let months = today.getMonth() - date.getMonth();

  if (today.getDate() < date.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0 && months <= 0) return "Moins d'un mois";
  if (years <= 0) return `${months} mois`;
  if (months <= 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
}

export default function AddAnimalScreen() {
  const { profile, user } = useSession();
  const [nom, setNom] = useState("");
  const [espece, setEspece] = useState("Chien");
  const [race, setRace] = useState("");
  const [puce, setPuce] = useState("");
  const [dateNaissance, setDateNaissance] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sexe, setSexe] = useState<(typeof sexOptions)[number]["value"]>("inconnu");
  const [couleur, setCouleur] = useState("");
  const [poids, setPoids] = useState("");
  const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission requise", "Autorisez l'accès aux photos pour choisir une image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const onBirthDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (selectedDate) setDateNaissance(selectedDate);
  };

  const submit = async () => {
    if (!profile?.id || !user?.id) return;
    if (!nom.trim() || !espece.trim()) {
      Alert.alert("Information manquante", "Le nom et l'espèce sont obligatoires.");
      return;
    }

    const computedBirthDate = dateNaissance?.toISOString().slice(0, 10) ?? null;
    const parsedWeight = poids.trim() ? Number(poids.replace(",", ".")) : null;

    if (poids.trim() && (!parsedWeight || Number.isNaN(parsedWeight) || parsedWeight <= 0)) {
      Alert.alert("Poids invalide", "Saisissez un poids positif en kg, par exemple 12.5.");
      return;
    }

    setLoading(true);
    try {
      const ownerId = profile.compte_proprietaire_id ?? user.id;
      const animal = await createAnimal({
        nom: nom.trim(),
        espece: espece.trim(),
        race: race.trim() || null,
        date_naissance: computedBirthDate,
        sexe,
        couleur: couleur.trim() || null,
        puce: puce.trim() || null,
      });
      if (photo) {
        await uploadAnimalPhoto({
          ownerId,
          animalId: animal.id,
          asset: photo,
        });
      }
      if (parsedWeight) {
        await createMedicalEvent({
          animal_id: animal.id,
          type: "consultation",
          titre: "Poids initial",
          description: "Poids renseigné à la création de la fiche animal.",
          poids_kg: parsedWeight,
        });
      }
      router.replace(`/(app)/animal/${animal.id}`);
    } catch (error) {
      Alert.alert("Création impossible", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Nouvel animal</Text>
        <Text style={styles.subtitle}>Créez sa fiche d'identité médicale.</Text>
      </View>
      <Pressable style={styles.photoPicker} onPress={choosePhoto}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} contentFit="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoIcon}>+</Text>
            <Text style={styles.photoText}>Ajouter une photo</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.form}>
        <AppInput label="Nom" value={nom} onChangeText={setNom} placeholder="Filou" />
        <View style={styles.field}>
          <Text style={styles.label}>Espèce</Text>
          <View style={styles.speciesGrid}>
            {speciesOptions.map((option) => {
              const selected = espece === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setEspece(option)}
                  style={[styles.speciesChip, selected && styles.speciesChipSelected]}
                >
                  <Text style={[styles.speciesText, selected && styles.speciesTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <AppInput label="Race" value={race} onChangeText={setRace} placeholder="Européen" />
        <View style={styles.field}>
          <Text style={styles.label}>Sexe</Text>
          <View style={styles.speciesGrid}>
            {sexOptions.map((option) => {
              const selected = sexe === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSexe(option.value)}
                  style={[styles.speciesChip, selected && styles.speciesChipSelected]}
                >
                  <Text style={[styles.speciesText, selected && styles.speciesTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Date de naissance</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.dateText, !dateNaissance && styles.placeholderText]}>
              {formatBirthDate(dateNaissance)}
            </Text>
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={dateNaissance ?? new Date(2020, 0, 1)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={onBirthDateChange}
            />
          ) : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Âge</Text>
          <View style={styles.readOnlyBox}>
            <Text style={[styles.dateText, !dateNaissance && styles.placeholderText]}>
              {formatComputedAge(dateNaissance)}
            </Text>
          </View>
        </View>
        <AppInput label="Couleur" value={couleur} onChangeText={setCouleur} placeholder="Noir et blanc" />
        <AppInput
          label="Poids initial (kg)"
          value={poids}
          onChangeText={setPoids}
          keyboardType="decimal-pad"
          placeholder="Optionnel, ex: 12.5"
        />
        <AppInput
          label="Numéro de puce"
          value={puce}
          onChangeText={setPuce}
          placeholder="Optionnel"
        />
      </View>
      <AppButton
        title={loading ? "Création..." : "Créer la fiche"}
        onPress={submit}
        disabled={loading}
      />
      <AppButton title="Annuler" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  photoPicker: {
    alignSelf: "center",
    width: 128,
    height: 128,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  photoIcon: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: "900",
  },
  photoText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 12,
  },
  speciesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  speciesChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  speciesChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  speciesText: {
    color: colors.textMuted,
    fontWeight: "800",
  },
  speciesTextSelected: {
    color: colors.white,
  },
  dateButton: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  readOnlyBox: {
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  dateText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  placeholderText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
});
