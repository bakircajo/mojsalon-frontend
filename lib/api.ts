import { getToken, removeToken } from "@/lib/auth";
import type {
  User,
  Shop,
  ShopCreatePayload,
  ShopUpdatePayload,
  Service,
  Booking,
  BookingCreatePayload,
  BookingStatus,
  SlotInfo,
  Staff,
  StaffServicePricing,
} from "@/lib/types";

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
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    // Ako je token nevažeći ili istekao (401), očisti ga i preusmjeri na /admin/login
    if (res.status === 401) {
      removeToken();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }

    let detail = `Greška ${res.status}`;
    try {
      const data = await res.json();

      // Ne prljaj konzolu logovima za očekivane 404 i 401 greške
      if (res.status !== 404 && res.status !== 401) {
        console.error("[Backend Error Detail]:", data);
      }

      if (Array.isArray(data.detail)) {
        detail = data.detail.map((err: any) => `${err.loc.join("->")}: ${err.msg}`).join(" | ");
      } else if (data.detail) {
        detail = data.detail;
      }
    } catch {
      // no-op
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

// ---------- Saloni ----------

export function createShop(payload: ShopCreatePayload) {
  return request<Shop>(
    "/shops/",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export function updateShopInfo(shopId: number, payload: { name?: string; description?: string; shop_type?: string; instagram?: string; phone?: string }) {
  return request<Shop>(`/shops/${shopId}/info`, { method: "PATCH", body: JSON.stringify(payload) }, true);
}

export function updateShopLocation(shopId: number, payload: { address?: string; full_address?: string; latitude?: number | null; longitude?: number | null }) {
  return request<Shop>(`/shops/${shopId}/location`, { method: "PATCH", body: JSON.stringify(payload) }, true);
}

export function updateShopWorkingHours(shopId: number, workingHours: Record<string, any>) {
  return request<Shop>(`/shops/${shopId}/working-hours`, { method: "PATCH", body: JSON.stringify({ working_hours: workingHours }) }, true);
}

export function updateShopAppearance(shopId: number, payload: { theme?: string; accent_color?: string; font_family?: string; border_radius?: number; enabled_sections?: string[]; staff?: any[] }) {
  return request<Shop>(`/shops/${shopId}/appearance`, { method: "PATCH", body: JSON.stringify(payload) }, true);
}

export function updateShopPublishStatus(shopId: number, isPublished: boolean) {
  return request<Shop>(`/shops/${shopId}/publish`, { method: "PATCH", body: JSON.stringify({ is_published: isPublished }) }, true);
}

export function updateShopGallery(shopId: number, galleryImages: string[]) {
  return request<Shop>(`/shops/${shopId}/gallery`, { method: "PATCH", body: JSON.stringify({ gallery_images: galleryImages }) }, true);
}

export async function updateShop(shopId: number, payload: ShopUpdatePayload & { staff?: any[]; gallery_images?: string[] }) {
  let updatedShop: Shop | null = null;

  if (payload.name !== undefined || payload.description !== undefined || payload.shop_type !== undefined || payload.instagram !== undefined || payload.phone !== undefined) {
    updatedShop = await updateShopInfo(shopId, {
      name: payload.name,
      description: payload.description,
      shop_type: payload.shop_type,
      instagram: payload.instagram,
      phone: payload.phone,
    });
  }

  if (payload.address !== undefined || payload.full_address !== undefined || payload.latitude !== undefined || payload.longitude !== undefined) {
    const parseCoord = (val: any) => (val !== "" && val !== null && val !== undefined && !isNaN(Number(val))) ? Number(val) : null;
    updatedShop = await updateShopLocation(shopId, {
      address: payload.address,
      full_address: payload.full_address,
      latitude: parseCoord(payload.latitude),
      longitude: parseCoord(payload.longitude),
    });
  }

  if (payload.working_hours !== undefined) {
    updatedShop = await updateShopWorkingHours(shopId, payload.working_hours);
  }

  if (payload.theme !== undefined || payload.accent_color !== undefined || payload.font_family !== undefined || payload.border_radius !== undefined || payload.enabled_sections !== undefined || payload.staff !== undefined) {
    updatedShop = await updateShopAppearance(shopId, {
      theme: payload.theme,
      accent_color: payload.accent_color,
      font_family: payload.font_family,
      border_radius: payload.border_radius,
      enabled_sections: payload.enabled_sections,
      staff: payload.staff,
    });
  }

  if (payload.gallery_images !== undefined) {
    updatedShop = await updateShopGallery(shopId, payload.gallery_images);
  }

  if (payload.is_published !== undefined) {
    updatedShop = await updateShopPublishStatus(shopId, payload.is_published);
  }

  return updatedShop || (await getShop(shopId));
}

export function getMyShops() {
  return request<Shop[]>("/shops/", {}, true);
}

export function getShop(shopId: number) {
  return request<Shop>(`/shops/${shopId}`, {}, true);
}

export function getShopBySlug(slug: string) {
  return request<Shop>(`/shops/by-slug/${slug}`);
}

export function getPublicShops() {
  return request<Shop[]>("/shops/public");
}

export async function deleteShop(shopId: number): Promise<void> {
  return request<void>(`/shops/${shopId}`, {
    method: "DELETE",
  }, true); // <- OVDJE JE DODAT 'true' ZA AUTH TOKEN
}

// ---------- Uposlenici / Radnici ----------

export async function getStaffForShop(shopId: number): Promise<Staff[]> {
  try {
    return await request<Staff[]>(`/staff/shop/${shopId}`);
  } catch (err) {
    console.error("Greška pri dohvatanju radnika:", err);
    return [];
  }
}

export function createStaff(payload: {
  name: string;
  role?: string;
  shop_id: number;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  email?: string;
}) {
  return request<Staff>("/staff/", { method: "POST", body: JSON.stringify(payload) }, true);
}

export function updateStaff(
  staffId: number,
  payload: { name?: string; role?: string; avatar_url?: string; bio?: string; phone?: string; email?: string }
) {
  return request<Staff>(`/staff/${staffId}`, { method: "PATCH", body: JSON.stringify(payload) }, true);
}

export function deleteStaff(staffId: number) {
  return request<void>(`/staff/${staffId}`, { method: "DELETE" }, true);
}

// ---------- Staff-specifične cijene usluga ----------

export function getStaffServicePricing(staffId: number) {
  return request<StaffServicePricing[]>(`/staff/${staffId}/services`);
}

export function upsertStaffServicePrice(
  staffId: number,
  serviceId: number,
  payload: { price?: number | null; duration_minutes?: number | null }
) {
  return request<StaffServicePricing>(
    `/staff/${staffId}/services/${serviceId}`,
    { method: "PUT", body: JSON.stringify(payload) },
    true
  );
}

export function deleteStaffServicePrice(staffId: number, serviceId: number) {
  return request<StaffServicePricing>(
    `/staff/${staffId}/services/${serviceId}`,
    { method: "DELETE" },
    true
  );
}

// ---------- Usluge ----------

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

export function updateService(
  serviceId: number,
  payload: {
    title?: string;
    description?: string;
    price?: number;
    duration_minutes?: number;
  }
) {
  return request<Service>(
    `/services/${serviceId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    true
  );
}

export function getServicesForShop(shopId: number) {
  return request<Service[]>(`/services/shop/${shopId}`);
}

export function deleteService(serviceId: number) {
  return request<void>(`/services/${serviceId}`, { method: "DELETE" }, true);
}

// ---------- Rezervacije ----------

export function createBooking(payload: BookingCreatePayload) {
  return request<Booking>("/bookings/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAvailableSlots(
  shopId: number,
  serviceId: number,
  bookingDate: string,
  staffId?: number
) {
  const params = new URLSearchParams({
    shop_id: String(shopId),
    service_id: String(serviceId),
    booking_date: bookingDate,
  });
  if (staffId) {
    params.append("staff_id", String(staffId));
  }
  return request<SlotInfo[]>(
    `/bookings/available-slots?${params.toString()}`,
    { cache: "no-store" }
  );
}

export function getShopBookings(
  shopId: number,
  params?: { page?: number; limit?: number; startDate?: string; endDate?: string }
) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.startDate) search.set("start_date", params.startDate);
  if (params?.endDate) search.set("end_date", params.endDate);
  const qs = search.toString();
  return request<Booking[]>(`/bookings/shop/${shopId}${qs ? `?${qs}` : ""}`, {}, true);
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