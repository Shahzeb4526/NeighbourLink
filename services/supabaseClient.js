// ============================================
// SUPABASE CLIENT - Authentication
// ============================================

import { createClient } from "@supabase/supabase-js";
import {
  projectId,
  publicAnonKey,
  supabaseUrl,
} from "../utils/supabase/info.js";

const hasPlaceholderConfig =
  !supabaseUrl ||
  !projectId ||
  !publicAnonKey ||
  projectId === "YOUR_SUPABASE_PROJECT_ID" ||
  publicAnonKey === "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(supabaseUrl, publicAnonKey);

export const signIn = async (email, password) => {
  if (hasPlaceholderConfig) {
    throw new Error(
      "Supabase is not configured. Update utils/supabase/info.js with your real projectId and anon key.",
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    const message = error.message || "Unable to sign in.";
    if (message.toLowerCase().includes("invalid")) {
      throw new Error("Email or password is incorrect.");
    }
    throw new Error(message);
  }
  return data;
};

export const signUp = async (email, password, metadata = {}) => {
  if (hasPlaceholderConfig) {
    throw new Error(
      "Supabase is not configured. Update utils/supabase/info.js with your real projectId and anon key.",
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) {
    const message = error.message || "Unable to create account.";
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes("user already registered")) {
      return {
        alreadyRegistered: true,
      };
    }

    if (normalizedMessage.includes("signups not allowed")) {
      throw new Error(
        "Email signups are disabled in Supabase. Enable Email provider signups in Authentication settings.",
      );
    }

    if (
      normalizedMessage.includes("rate limit") ||
      normalizedMessage.includes("email_send_rate_limit")
    ) {
      throw new Error(
        "Email rate limit exceeded. For testing: disable 'Confirm email' in Supabase Dashboard > Authentication > Email Provider, then try again.",
      );
    }

    throw new Error(message);
  }
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};
