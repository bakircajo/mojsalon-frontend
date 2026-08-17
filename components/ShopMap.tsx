"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ShopMapProps {
  latitude: number;
  longitude: number;
  shopName: string;
  address: string;
}

export default function ShopMap({ latitude, longitude, shopName, address }: ShopMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Ako mapa već postoji, uklonimo je prije ponovnog kreiranja
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Inicijalizacija čistog Leaflet-a
    const map = L.map(mapRef.current).setView([latitude, longitude], 15);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Prilagođena ikona za marker
    const customIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    L.marker([latitude, longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<strong>${shopName}</strong><br />${address}`);

    // Cleanup funkcija pri zatvaranju komponente
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, shopName, address]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[300px] rounded-xl overflow-hidden shadow-md mt-4 border z-0"
      style={{ borderColor: "#27272A" }}
    />
  );
}