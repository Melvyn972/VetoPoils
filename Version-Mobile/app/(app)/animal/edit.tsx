import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Screen } from "@/components/ui/Screen";
import { fetchAnimal, updateAnimal, uploadAnimalPhoto } from "@/features/animals/animals.service";
import { createMedicalEvent, fetchMedicalEvents } from "@/features/medical/medical.service";
import { useSession } from "@/hooks/useSession";
import { colors, radius, spacing, typography } from "@/theme";
import type { Animal } from "@/types/database.types";
import { computeAgeLabel, formatDateForDatabase, formatLongDate } from "@/utils/dates";
import { getErrorMessage } from "@/utils/errors";

const speciesOptions = ["Chien", "Chat", "Lapin", "Oiseau", "Rongeur", "Reptile", "Autre"];
const sexOptions = [
  { label: "Mâle", value: "male" },
  { label: "Femelle", value: "femelle" },
  { label: "Inconnu", value: "inconnu" },
] as const;

export default function EditAnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, user } = useSession();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [nom, setNom] = useState("");
  const [espece, setEspece] = useState("Chien");
  const [race, setRace] = useState("");
  const [sexe, setSexe] = useState<(typeof sexOptions)[number]["value"]>("inconnu");
  const [dateNaissance, setDateNaissance] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [couleur, setCouleur] = useState("");
  const [poids, setPoids] = useState("");
  const [puce, setPuce] = useState("");
  const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchAnimal(id), fetchMedicalEvents(id)]).then(([nextAnimal, events]) => {
      setAnimal(nextAnimal);
      setNom(nextAnimal?.nom ?? "");
      setEspece(nextAnimal?.espece ?? "Chien");
      setRace(nextAnimal?.race ?? "");
      setSexe(nextAnimal?.sexe ?? "inconnu");
      setDateNaissance(nextAnimal?.date_naissance ? new Date(nextAnimal.date_naissance) : null);
      setCouleur(nextAnimal?.couleur ?? "");
      setPuce(nextAnimal?.puce ?? "");
      const lastWeight = events.find((event) => event.poids_kg)?.poids_kg;
      setPoids(lastWeight ? String(lastWeight) : "");
    });
  }, [id]);

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

    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const onBirthDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (selectedDate) setDateNaissance(selectedDate);
  };

  const submit = async () => {
    if (!id || !profile?.id || !user?.id) return;
    const parsedWeight = poids.trim() ? Number(poids.replace(",", ".")) : null;

    if (poids.trim() && (!parsedWeight || Number.isNaN(parsedWeight) || parsedWeight <= 0)) {
      Alert.alert("Poids invalide", "Saisissez un poids positif en kg.");
      return;
    }

    setSaving(true);
    try {
      await updateAnimal(id, {
        nom: nom.trim(),
        espece,
        race: race.trim() || null,
        sexe,
        date_naissance: formatDateForDatabase(dateNaissance),
        couleur: couleur.trim() || null,
        puce: puce || null,
      });
      if (photo) {
        await uploadAnimalPhoto({
          ownerId: profile.compte_proprietaire_id ?? user.id,
          animalId: id,
          asset: photo,
        });
      }
      if (parsedWeight) {
        await createMedicalEvent({
          animal_id: id,
          type: "consultation",
          titre: "Mise à jour du poids",
          description: "Poids modifié depuis la fiche animal.",
          poids_kg: parsedWeight,
        });
      }
      router.back();
    } catch (error) {
      Alert.alert("Mise à jour impossible", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View>
        <Text style={styles.title}>Modifier {animal?.nom ?? "l'animal"}</Text>
        <Text style={styles.subtitle}>Identité et informations principales.</Text>
      </View>
      <Pressable style={styles.photoPicker} onPress={choosePhoto}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} contentFit="cover" />
        ) : (
          <Text style={styles.photoText}>Changer la photo</Text>
        )}
      </Pressable>
      <View style={styles.form}>
        <AppInput label="Nom" value={nom} onChangeText={setNom} />
        <View style={styles.field}>
          <Text style={styles.label}>Espèce</Text>
          <View style={styles.chipGrid}>
            {speciesOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => setEspece(option)}
                style={[styles.chip, espece === option && styles.chipSelected]}
              >
                <Text style={[styles.chipText, espece === option && styles.chipTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <AppInput label="Race" value={race} onChangeText={setRace} />
        <View style={styles.field}>
          <Text style={styles.label}>Sexe</Text>
          <View style={styles.chipGrid}>
            {sexOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setSexe(option.value)}
                style={[styles.chip, sexe === option.value && styles.chipSelected]}
              >
                <Text style={[styles.chipText, sexe === option.value && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Date de naissance</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{formatLongDate(dateNaissance)}</Text>
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
            <Text style={styles.dateText}>{computeAgeLabel(dateNaissance)}</Text>
          </View>
        </View>
        <AppInput label="Couleur" value={couleur} onChangeText={setCouleur} />
        <AppInput label="Poids actuel (kg)" value={poids} onChangeText={setPoids} keyboardType="decimal-pad" />
        <AppInput label="Puce (optionnel)" value={puce} onChangeText={setPuce} />
      </View>
      <AppButton title={saving ? "Enregistrement..." : "Enregistrer"} onPress={submit} disabled={saving} />
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
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  photoText: {
    color: colors.primary,
    fontWeight: "800",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontWeight: "800",
  },
  chipTextSelected: {
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
});
