"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "bs-pin",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#006c49" stroke="white" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const round = (n: number) => Math.round(n * 1e4) / 1e4;
const DEFAULT_CENTER: [number, number] = [-6.2, 106.8];

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  height = 320,
}: {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const start: [number, number] = [
      latitude ?? DEFAULT_CENTER[0],
      longitude ?? DEFAULT_CENTER[1],
    ];

    const map = L.map(containerRef.current, { zoomControl: true }).setView(start, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(start, { draggable: true, icon: pinIcon }).addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      onChange(round(p.lat), round(p.lng));
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(round(e.latlng.lat), round(e.latlng.lng));
    });

    mapRef.current = map;
    markerRef.current = marker;
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // init once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (latitude == null || longitude == null) return;
    const cur = markerRef.current.getLatLng();
    if (round(cur.lat) !== round(latitude) || round(cur.lng) !== round(longitude)) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.setView([latitude, longitude]);
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-lg overflow-hidden border border-outline-variant z-0"
    />
  );
}
