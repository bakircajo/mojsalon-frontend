import { getToken } from "./auth";
import type {
  User,
  Shop,
  ShopCreatePayload,
  ShopUpdatePayload,
  Service,
  Booking,
  BookingCreatePayload,
  BookingStatus,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = `Greška ${res.status}`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // no-op — response had no JSON body
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Auth ----------

export function registerUser(email: string, password: string) {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginUser(email: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  return request<{ access_token: string; token_type: string }>(
    "/auth/login",
    { method: "POST", body }
  );
}

export function getMe() {
  return request<User>("/auth/me", {}, true);
}

// ---------- Shops ----------

export function createShop(payload: ShopCreatePayload) {
  return request<Shop>(
    "/shops/",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export function updateShop(shopId: number, payload: ShopUpdatePayload) {
  return request<Shop>(
    `/shops/${shopId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    true
  );
}

export function getMyShops() {
  return request<Shop[]>("/shops/", {}, true);
}

export function getShop(shopId: number) {
  return request<Shop>(`/shops/${shopId}`, {}, true);
}

export function getPublicShop(shopId: number) {
  return request<Shop>(`/shops/public/${shopId}`);
}

export function getShopBySlug(slug: string) {
  return request<Shop>(`/shops/by-slug/${slug}`);
}

// Nova funkcija za pretragu salona dok korisnik kuca
export function searchShops(query: string) {
  return request<Shop[]>(`/shops/search?q=${encodeURIComponent(query)}`);
}

// ---------- Services ----------

export function createService(payload: {
  title: string;
  description: string;
  price: number;
  duration_minutes: number;
  shop_id: number;
}) {
  return request<Service>(
    "/services/",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export function getServicesForShop(shopId: number) {
  return request<Service[]>(`/services/shop/${shopId}`);
}

export function deleteService(serviceId: number) {
  return request<void>(`/services/${serviceId}`, { method: "DELETE" }, true);
}

// ---------- Bookings ----------

export function createBooking(payload: BookingCreatePayload) {
  return request<Booking>("/bookings/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAvailableSlots(
  shopId: number,
  serviceId: number,
  bookingDate: string
) {
  const params = new URLSearchParams({
    shop_id: String(shopId),
    service_id: String(serviceId),
    booking_date: bookingDate,
  });
  return request<string[]>(`/bookings/available-slots?${params.toString()}`);
}

export function getShopBookings(shopId: number) {
  return request<Booking[]>(`/bookings/shop/${shopId}`, {}, true);
}

export function updateBookingStatus(
  bookingId: number,
  status: BookingStatus
) {
  return request<Booking>(
    `/bookings/${bookingId}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
    true
  );
}

export function deleteBooking(bookingId: number) {
  return request<void>(`/bookings/${bookingId}`, { method: "DELETE" }, true);
}