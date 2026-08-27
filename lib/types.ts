export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Shop {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  owner_id: number;
  created_at: string;
  shop_type: string;
  instagram: string | null;
  phone?: string | null;
  theme: string;
  accent_color: string;
  font_family: string;
  border_radius: number;
  enabled_sections: string[];
  is_published: boolean;
  address: string | null;
  full_address?: string | null;
  latitude: number | null;
  longitude: number | null;
  working_hours: any | null;
  gallery_images?: string[] | string | null; // NOVO
}
// -------------------------------------------------------------------
// 1. KREIRANJE SALONA (Minimalni Payload prema novom DTO-u na backendu)
// Uklonjen slug i sve postavke dizajna i radnog vremena.
// -------------------------------------------------------------------
export interface ShopCreatePayload {
  name: string;
  address: string;
  shop_type?: string;
  description?: string;
}

// -------------------------------------------------------------------
// 2. AŽURIRANJE SALONA (Ostaje sve za postavljanje tema, radnog vremena...)
// -------------------------------------------------------------------
export interface ShopUpdatePayload {
  name?: string;
  description?: string;
  is_active?: boolean;
  shop_type?: string;
  instagram?: string;
  phone?: string;
  theme?: string;
  accent_color?: string;
  font_family?: string;
  border_radius?: number;
  enabled_sections?: string[];
  is_published?: boolean;
  address?: string;
  full_address?: string;
  latitude?: number | null;
  longitude?: number | null;
  working_hours?: any;
  // Fotogalerija salona pri čuvanju postavki
  gallery_images?: string[] | string;
}

export interface Service {
  id: number;
  title: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  shop_id: number;
  created_at: string;
}

export interface Booking {
  id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  start_time: string;
  end_time: string;
  shop_id: number;
  service_id: number;
  staff_id?: number | null;
  staff?: { id: number; name: string } | null; // NOVO: podaci o dodijeljenom radniku
  status: BookingStatus;
  created_at: string;
}

export interface SlotInfo {
  time: string;
  available: boolean;
}

export interface BookingCreatePayload {
  client_name: string;
  client_email: string;
  client_phone: string;
  start_time: string;
  shop_id: number;
  service_id: number;
  staff_id?: number;
}

export interface Staff {
  id: number;
  name: string;
  role?: string;
  avatar_url?: string;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  shop_id?: number;
}

// Rezolvovana cijena/trajanje usluge za konkretnog radnika (override ako postoji, inače bazna vrijednost)
export interface StaffServicePricing {
  id: number;
  title: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_overridden: boolean;
  is_active: boolean;
}