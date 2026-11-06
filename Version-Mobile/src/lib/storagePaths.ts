export function buildAnimalStoragePath(params: {
  ownerId: string;
  animalId: string;
  fileName: string;
}) {
  const extension = params.fileName.split(".").pop() ?? "bin";
  return `${params.ownerId}/${params.animalId}/${Date.now()}.${extension}`;
}
