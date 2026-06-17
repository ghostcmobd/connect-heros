import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";

declare global {
  interface Window {
    L?: any;
    __leafletLoading?: Promise<any>;
    __leafletCssLoaded?: boolean;
  }
}

function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (!window.__leafletCssLoaded) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    window.__leafletCssLoaded = true;
  }
  if (window.L) return Promise.resolve(window.L);
  if (window.__leafletLoading) return window.__leafletLoading;
  window.__leafletLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.async = true;
    s.onload = () => resolve(window.L);
    s.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.head.appendChild(s);
  });
  return window.__leafletLoading;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
    );
    const data = await res.json();
    const a = data?.address ?? {};
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? null;
    const country = a.country ?? null;
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (data?.display_name) return String(data.display_name).split(",").slice(0, 2).join(",");
    return null;
  } catch {
    return null;
  }
}

export type LocationValue = {
  city_name: string;
  city_lat: number | null;
  city_lng: number | null;
};

export function LocationPicker({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);

  // Init map
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      const start: [number, number] =
        value.city_lat != null && value.city_lng != null
          ? [value.city_lat, value.city_lng]
          : [23.8103, 90.4125]; // Dhaka default
      const map = L.map(mapEl.current, {
        center: start,
        zoom: value.city_lat != null ? 11 : 5,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);
      if (value.city_lat != null && value.city_lng != null) {
        markerRef.current = L.marker([value.city_lat, value.city_lng]).addTo(map);
      }
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        placePin(lat, lng);
        const name = await reverseGeocode(lat, lng);
        onChange({ city_name: name ?? value.city_name, city_lat: lat, city_lng: lng });
      });
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value → marker/center
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (value.city_lat != null && value.city_lng != null) {
      placePin(value.city_lat, value.city_lng);
      mapRef.current.setView([value.city_lat, value.city_lng], 11);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.city_lat, value.city_lng, ready]);

  function placePin(lat: number, lng: number) {
    const L = window.L;
    if (!L || !mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        placePin(lat, lng);
        if (mapRef.current) mapRef.current.setView([lat, lng], 12);
        const name = await reverseGeocode(lat, lng);
        onChange({ city_name: name ?? value.city_name, city_lat: lat, city_lng: lng });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={value.city_name}
          onChange={(e) => onChange({ ...value, city_name: e.target.value })}
          placeholder="City, Country (e.g. Dhaka, Bangladesh)"
          className="flex-1 min-w-[180px] rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="btn-press inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-primary hover:border-primary disabled:opacity-50"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
          Use my location
        </button>
      </div>
      <div
        ref={mapEl}
        className="h-56 w-full overflow-hidden rounded-xl border border-border bg-surface/40"
      />
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        Tap the map to drop a pin, or use your live location.
        {value.city_lat != null && value.city_lng != null && (
          <span className="ml-1 font-mono text-[10px]">
            ({value.city_lat.toFixed(3)}, {value.city_lng.toFixed(3)})
          </span>
        )}
      </p>
    </div>
  );
}
