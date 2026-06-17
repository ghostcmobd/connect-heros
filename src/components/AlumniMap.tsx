import { useEffect, useRef } from "react";
import type { CityPin } from "@/lib/site.functions";

declare global {
  interface Window {
    L?: any;
    __leafletLoading?: Promise<any>;
  }
}

function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
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

export function AlumniMap({ cities }: { cities: CityPin[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [25, 10], zoom: 2, minZoom: 2, maxZoom: 8,
          worldCopyJump: true, scrollWheelZoom: true,
        });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;
      if (layerRef.current) map.removeLayer(layerRef.current);
      const group = L.layerGroup();
      for (const c of cities) {
        const radius = Math.max(8, Math.min(24, 6 + c.count * 2.2));
        const marker = L.circleMarker([c.lat, c.lng], {
          radius, color: "#4b6b52", weight: 2, fillColor: "#b7cdb5", fillOpacity: 0.75,
        });
        marker.bindTooltip(
          `<div style="font-weight:600;color:#3a4f3f;font-size:12px">${escapeHtml(c.city_name)}</div>
           <div style="color:#6c7d72;font-size:11px">${c.count} alumni</div>`,
          { direction: "top", offset: [0, -radius], opacity: 1 }
        );
        const lis = c.alumni.slice(0, 6).map((a) =>
          `<li style="margin-bottom:6px;line-height:1.25">
            <a href="/alumni/${a.id}" style="font-weight:600;color:#4b6b52;text-decoration:none">${escapeHtml(a.full_name)}</a>
            <div style="color:#6c7d72;font-size:11px">${escapeHtml(a.role_title ?? "")}${a.company ? ` · ${escapeHtml(a.company)}` : ""}</div>
          </li>`
        ).join("");
        const more = c.alumni.length > 6 ? `<li style="font-size:11px;color:#6c7d72">+ ${c.alumni.length - 6} more</li>` : "";
        marker.bindPopup(
          `<div style="min-width:200px">
            <div style="font-weight:600;color:#3a4f3f;font-size:13px">${escapeHtml(c.city_name)}</div>
            <div style="color:#6c7d72;font-size:11px;margin-bottom:8px">${c.count} alumni</div>
            <ul style="list-style:none;padding:0;margin:0;font-size:12px">${lis}${more}</ul>
          </div>`
        );
        marker.addTo(group);
      }
      group.addTo(map);
      layerRef.current = group;
    }).catch((err) => console.error("Map failed to load:", err));
    return () => { cancelled = true; };
  }, [cities]);

  useEffect(() => () => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
  }, []);

  return <div ref={containerRef} style={{ height: "100%", width: "100%", background: "#eef2ec" }} />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
