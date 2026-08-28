import { getCpToken, clearCpToken } from "@/lib/cpAuth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export class CpApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function cpRequest<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getCpToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) {
      // Ističe/nevažeći CP token — očisti ga, stranica se sama vraća na login prikaz
      // (za razliku od tenant request() helpera, OVDJE se ne radi hard redirect).
      clearCpToken();
    }
    let detail = `Greška ${res.status}`;
    try {
      const data = await res.json();
      if (Array.isArray(data.detail)) {
        detail = data.detail.map((err: any) => `${err.loc.join("->")}: ${err.msg}`).join(" | ");
      } else if (data.detail) {
        detail = data.detail;
      }
    } catch {
      // no-op
    }
    throw new CpApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface AdminShopSummary {
  id: number;
  name: string;
  slug: string | null;
  shop_type: string | null;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
}

export interface AdminUserSummary {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
  requires_credential_update: boolean;
  email_verified: boolean;
  shops: AdminShopSummary[];
}

export async function cpLogin(username: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);
  return cpRequest<{ access_token: string; token_type: string }>(
    "/superadmin/login",
    { method: "POST", body },
    false
  );
}

export function getCpUsers() {
  return cpRequest<AdminUserSummary[]>("/superadmin/users");
}

export interface CpCreatedUser {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
  requires_credential_update: boolean;
  email_verified: boolean;
}

export function createCpUser(email: string, password: string) {
  return cpRequest<CpCreatedUser>("/superadmin/users", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface CpResetPasswordResult {
  email: string;
  temporary_password: string;
}

export function resetCpUserPassword(userId: number) {
  return cpRequest<CpResetPasswordResult>(`/superadmin/users/${userId}/reset-password`, {
    method: "POST",
  });
}

export function deleteCpShop(shopId: number) {
  return cpRequest<void>(`/superadmin/shops/${shopId}`, { method: "DELETE" });
}

export function deleteCpUser(userId: number) {
  return cpRequest<void>(`/superadmin/users/${userId}`, { method: "DELETE" });
}

export function updateCpCredentials(payload: {
  current_password: string;
  new_username?: string;
  new_password?: string;
}) {
  return cpRequest<{ detail: string }>("/superadmin/credentials", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
