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
  description: string | null;
  is_active: boolean;
  owner_id: number;
  created_at: string;
  // Novi podaci za Onboarding Wizard i Builder
  slug: string | null;
  shop_type: string;
  instagram: string | null;
  theme: string;
  accent_color: string;
  font_family: string;
  border_radius: number;
  enabled_sections: string[];
  is_published: boolean;
  // Adresa, koordinate i radno vrijeme
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  working_hours: any | null;
}

export interface ShopCreatePayload {
  name: string;
  description?: string;
  slug?: string;
  shop_type?: string;
  instagram?: string;
  theme?: string;
  accent_color?: string;
  font_family?: string;
  border_radius?: number;
  enabled_sections?: string[];
  // Adresa, koordinate i radno vrijeme
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  working_hours?: any;
}

export interface ShopUpdatePayload {
  name?: string;
  description?: string;
  is_active?: boolean;
  slug?: string;
  shop_type?: string;
  instagram?: string;
  theme?: string;
  accent_color?: string;
  font_family?: string;
  border_radius?: number;
  enabled_sections?: string[];
  is_published?: boolean;
  // Adresa, koordinate i radno vrijeme
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  working_hours?: any;
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
  status: BookingStatus;
  created_at: string;
}

export interface BookingCreatePayload {
  client_name: string;
  client_email: string;
  client_phone: string;
  start_time: string;
  shop_id: number;
  service_id: number;
}