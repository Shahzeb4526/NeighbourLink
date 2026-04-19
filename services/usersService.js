import { supabase } from "./supabaseClient";

export const upsertUserProfileDirect = async (user, overrides = {}) => {
  if (!user?.id) {
    return;
  }

  const payload = {
    id: user.id,
    email: overrides?.email ?? user.email ?? null,
    full_name:
      overrides?.full_name ||
      user.user_metadata?.full_name ||
      (user.email ? user.email.split("@")[0] : "Neighbour User"),
    phone: overrides?.phone ?? user.user_metadata?.phone ?? null,
    role: "user",
    status: "active",
  };

  const { error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw new Error(error.message || "Unable to sync user profile.");
  }
};

export const readBackendUserEmail = async (userId) => {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to verify backend email.");
  }

  return data?.email ? String(data.email).trim() : null;
};
