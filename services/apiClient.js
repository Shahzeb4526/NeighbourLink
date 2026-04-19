// ============================================
// API CLIENT - Backend communication
// ============================================

import {
  functionsBaseUrl,
  projectId,
  publicAnonKey,
  supabaseUrl,
} from "../utils/supabase/info.js";

const API_URL = functionsBaseUrl;
const hasPlaceholderConfig =
  !API_URL ||
  !supabaseUrl ||
  !projectId ||
  !publicAnonKey ||
  projectId === "YOUR_SUPABASE_PROJECT_ID" ||
  publicAnonKey === "YOUR_SUPABASE_ANON_KEY";

async function apiCall(endpoint, options = {}) {
  if (hasPlaceholderConfig) {
    throw new Error(
      "Supabase is not configured. Update utils/supabase/info.js with your real projectId and anon key.",
    );
  }

  const url = `${API_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    apikey: publicAnonKey,
    Authorization: `Bearer ${publicAnonKey}`,
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return await response.json();
}

const authHeaders = (token) =>
  token ? { Authorization: `Bearer ${token}` } : {};

// Auth
export const signUp = (data) =>
  apiCall("/auth/signup", { method: "POST", body: JSON.stringify(data) });
export const createUserProfile = (data) =>
  apiCall("/auth/create-profile", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Items
export const getAllItems = () => apiCall("/items");
export const getItemById = (id) => apiCall(`/items/${id}`);
export const getUserItems = (token, userId) =>
  apiCall(`/items/user/${userId}`, { headers: authHeaders(token) });
export const createItem = (token, data) =>
  apiCall("/items", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
export const updateItem = (token, id, data) =>
  apiCall(`/items/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
export const deleteItem = (token, id) =>
  apiCall(`/items/${id}`, { method: "DELETE", headers: authHeaders(token) });

// Requests
export const createBorrowRequest = (token, data) =>
  apiCall("/requests", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
export const getBorrowRequests = (token) =>
  apiCall("/requests", { headers: authHeaders(token) });
export const updateBorrowRequest = (token, id, data) =>
  apiCall(`/requests/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

// Messages
export const getMessages = (token) =>
  apiCall("/messages", { headers: authHeaders(token) });
export const sendMessage = (token, data) =>
  apiCall("/messages", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

// Users
export const getUserProfile = (id) => apiCall(`/users/${id}`);
export const getAllUsers = () => apiCall("/users");
