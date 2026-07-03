export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const maybeError = error as { message?: unknown; details?: unknown; code?: unknown };
    const parts = [maybeError.message, maybeError.details, maybeError.code]
      .filter((part): part is string => typeof part === "string" && part.length > 0);

    if (parts.length > 0) return parts.join(" • ");
  }

  if (typeof error === "string") return error;

  return "Une erreur inattendue est survenue.";
}
