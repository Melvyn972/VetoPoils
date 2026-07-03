import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";
import type { DocumentCategory } from "@/types/database.types";

export function isImageDocument(mimeType?: string | null) {
  return !!mimeType?.startsWith("image/");
}

export async function getDocumentSignedUrl(filePath: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from("animal-documents")
    .createSignedUrl(filePath, expiresIn);

  if (error) throw error;
  if (!data?.signedUrl) throw new Error("URL du document indisponible.");

  return data.signedUrl;
}

export function getPdfViewerUrl(signedUrl: string) {
  if (Platform.OS === "android") {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(signedUrl)}`;
  }

  return signedUrl;
}

export async function fetchDocuments(animalId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("animal_id", animalId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function pickDocumentFromDevice() {
  return DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    copyToCacheDirectory: true,
  });
}

export async function pickImageFromLibrary() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Permission galerie refusée. Autorisez l'accès aux photos dans les réglages.");
  }

  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    allowsEditing: true,
  });
}

export async function pickImageFromCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Permission caméra refusée. Autorisez l'accès à la caméra dans les réglages.");
  }

  return ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    allowsEditing: true,
  });
}

export async function createDocumentMetadata(values: {
  animal_id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  taille_octets: number;
  category_ocr?: DocumentCategory | null;
}) {
  const { data, error } = await supabase
    .from("documents")
    .insert(values)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function incrementOcrUsage() {
  const { data, error } = await supabase.rpc("increment_ocr_usage", {});

  if (error) throw error;
  return data;
}
