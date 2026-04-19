const fallbackProjectId = "dtndxklniwvrxpiqbyym";
const fallbackAnonKey = "sb_publishable_ZaJj3gP2HMLSwuEDHBvrbA_Ht5C27R_";
const fallbackFunctionsPath = "/functions/v1/make-server-5c566271";

const envProjectId = String(
  process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID || "",
).trim();
const envAnonKey = String(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
).trim();
const envSupabaseUrl = String(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "",
).trim();
const envFunctionsBase = String(
  process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_BASE || "",
).trim();

const getProjectIdFromUrl = (url = "") => {
  const parsed = String(url || "").trim();
  if (!parsed) {
    return "";
  }
  try {
    const hostname = new URL(parsed).hostname;
    return hostname.endsWith(".supabase.co")
      ? hostname.replace(".supabase.co", "")
      : "";
  } catch {
    return "";
  }
};

export const projectId =
  envProjectId || getProjectIdFromUrl(envSupabaseUrl) || fallbackProjectId;

export const publicAnonKey = envAnonKey || fallbackAnonKey;

export const supabaseUrl =
  envSupabaseUrl || (projectId ? `https://${projectId}.supabase.co` : "");

export const functionsBaseUrl =
  envFunctionsBase ||
  (supabaseUrl ? `${supabaseUrl}${fallbackFunctionsPath}` : "");
