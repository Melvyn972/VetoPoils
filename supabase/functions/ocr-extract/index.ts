// Edge Function « ocr-extract » : photo/PDF -> Google Cloud Vision -> JSON structuré.
// La clé Vision reste côté serveur (secret GOOGLE_VISION_API_KEY), jamais dans l'app.
// Quota : 2 analyses/mois en plan gratuit, appliqué par les RPC check_ocr_quota /
// increment_ocr_usage. Le compteur n'est incrémenté qu'après une lecture réussie.
import { createClient } from "npm:@supabase/supabase-js@2";

import { parseOcrText } from "./parse.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BASE64_CHARS = 14_000_000; // ~10 Mo de fichier
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function visionText(base64: string, mimeType: string, apiKey: string): Promise<string> {
  const isPdf = mimeType === "application/pdf";
  const endpoint = isPdf
    ? "https://vision.googleapis.com/v1/files:annotate"
    : "https://vision.googleapis.com/v1/images:annotate";
  const feature = { type: "DOCUMENT_TEXT_DETECTION" };
  const body = isPdf
    ? {
        requests: [
          {
            inputConfig: { mimeType, content: base64 },
            features: [feature],
            pages: [1, 2, 3, 4, 5],
          },
        ],
      }
    : {
        requests: [
          { image: { content: base64 }, features: [feature], imageContext: { languageHints: ["fr", "en"] } },
        ],
      };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`vision_http_${response.status}`);

  const payload = await response.json();
  const first = payload?.responses?.[0];
  if (first?.error) throw new Error(`vision_error_${first.error.code ?? "unknown"}`);

  if (isPdf) {
    const pages: Array<{ fullTextAnnotation?: { text?: string } }> = first?.responses ?? [];
    return pages.map((p) => p.fullTextAnnotation?.text ?? "").join("\n");
  }
  return first?.fullTextAnnotation?.text ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
  if (!apiKey) return json(503, { error: "ocr_not_configured" });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { error: "unauthorized" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json(401, { error: "unauthorized" });

  let input: { image_base64?: unknown; mime_type?: unknown; file_name?: unknown };
  try {
    input = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }
  const base64 = typeof input.image_base64 === "string" ? input.image_base64 : "";
  const mimeType = typeof input.mime_type === "string" ? input.mime_type.toLowerCase() : "";
  const fileName = typeof input.file_name === "string" ? input.file_name.slice(0, 200) : "";

  if (!base64) return json(400, { error: "missing_file" });
  if (base64.length > MAX_BASE64_CHARS) return json(413, { error: "file_too_large" });
  if (mimeType !== "application/pdf" && !IMAGE_MIMES.includes(mimeType)) {
    return json(415, { error: "unsupported_type" });
  }

  const { data: quota, error: quotaError } = await supabase.rpc("check_ocr_quota");
  if (quotaError) return json(500, { error: "quota_check_failed" });
  if (!quota?.allowed) return json(429, { error: "quota_exceeded", quota });

  let text: string;
  try {
    text = await visionText(base64, mimeType, apiKey);
  } catch (error) {
    console.error("ocr-extract vision failure", error instanceof Error ? error.message : error);
    return json(502, { error: "vision_unavailable" });
  }
  if (!text.trim()) return json(422, { error: "no_text_found", quota });

  const result = parseOcrText(text, fileName);

  const { data: usage, error: usageError } = await supabase.rpc("increment_ocr_usage", {});
  if (usageError) {
    // Course perdue sur le quota entre la vérification et l'incrément.
    return json(429, { error: "quota_exceeded", quota });
  }

  const limit = quota.limit as number | null;
  return json(200, {
    result,
    quota: {
      plan: quota.plan,
      usage: usage as number,
      limit,
      remaining: limit === null ? null : Math.max(limit - (usage as number), 0),
    },
  });
});
