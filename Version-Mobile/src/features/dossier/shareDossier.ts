import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Linking, Share } from "react-native";

import type { Animal, Document, MedicalEvent, Reminder } from "@/types/database.types";

import { buildDossierHtml } from "./buildDossierHtml";

export async function exportAnimalDossierPdf(params: {
  animal: Animal;
  events: MedicalEvent[];
  documents: Document[];
  reminders?: Reminder[];
}) {
  const html = buildDossierHtml(params);
  const result = await Print.printToFileAsync({ html });
  if (!result.uri) {
    throw new Error("Le PDF n’a pas pu être généré.");
  }
  return result.uri;
}

export async function shareAnimalDossier(params: {
  animal: Animal;
  events: MedicalEvent[];
  documents: Document[];
  reminders?: Reminder[];
}) {
  const uri = await exportAnimalDossierPdf(params);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: `Dossier ${params.animal.nom}`,
    });
    return;
  }

  await Share.share({
    title: `Dossier Vet'OPoil — ${params.animal.nom}`,
    message: `Dossier médical de ${params.animal.nom} généré par Vet'OPoil.`,
    url: uri,
  });
}

export async function emailAnimalDossierFallback(animal: Animal) {
  const subject = encodeURIComponent(`Dossier médical Vet'OPoil — ${animal.nom}`);
  const body = encodeURIComponent(
    `Bonjour,\n\nVous trouverez ci-joint (à ajouter manuellement) le dossier médical de ${animal.nom} généré depuis Vet'OPoil.\n\nSi le PDF n’est pas attaché, utilisez d’abord « Exporter le PDF » puis joignez le fichier depuis le partage du téléphone.\n`,
  );
  const url = `mailto:?subject=${subject}&body=${body}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert(
      "E-mail indisponible",
      "Aucun client mail n’est configuré. Exportez le PDF puis envoyez-le depuis votre messagerie.",
    );
    return;
  }
  await Linking.openURL(url);
}
