"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ShopMapProps {
  latitude?: number;
  longitude?: number;
  shopName: string;
  address: string;
}

export default function ShopMap({ latitude, longitude, shopName, address }: ShopMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Validacija da li su koordinate ispravni brojevi
  const isValidLat = typeof latitude === "number" && !isNaN(latitude);
  const isValidLng = typeof longitude === "number" && !isNaN(longitude);
  const hasValidCoordinates = isValidLat && isValidLng;

  useEffect(() => {
    // 1. Zaustavi ako nemamo HTML ref ili ako koordinate nisu validne
    if (!mapRef.current || !hasValidCoordinates) return;

    // 2. Ako mapa već postoji, ukloni je
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // 3. Očisti unutrašnji HTML container-a radi sigurnosti (spriječava "container already initialized")
    mapRef.current.innerHTML = "";

    // 4. Inicijalizacija mape sa sigurnim vrijednostima
    const lat = latitude as number;
    const lng = longitude as number;

    const map = L.map(mapRef.current).setView([lat, lng], 15);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const customIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    L.marker([lat, lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<strong>${shopName}</strong><br />${address}`);

    // Cleanup funkcija
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, shopName, address, hasValidCoordinates]);

  // Ako koordinate nisu dostupne, prikaži fallback div umjesto prazne mape ili rušenja
  if (!hasValidCoordinates) {
    return (
      <div
        className="w-full h-[300px] rounded-xl mt-4 border flex items-center justify-center text-zinc-500 text-sm"
        style={{ borderColor: "#27272A" }}
      >
        Lokacija na mapi nije dostupna.
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[300px] rounded-xl overflow-hidden shadow-md mt-4 border z-0"
      style={{ borderColor: "#27272A" }}
    />
  );
}