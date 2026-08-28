"use client";

// Zaseban token store za Master Control Panel (superadmin), potpuno odvojen od
// salon_access_token (vlasnik salona) kako se dvije sesije nikad ne bi pomiješale.
const CP_TOKEN_KEY = "cp_access_token";

export function saveCpToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CP_TOKEN_KEY, token);
}

export function getCpToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CP_TOKEN_KEY);
}

export function clearCpToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CP_TOKEN_KEY);
}
