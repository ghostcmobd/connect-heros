import { useEffect, useRef } from "react";
import type { CityPin } from "@/lib/site.functions";

export function AlumniMap({ cities }: { cities: CityPin[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [25, 10],
          zoom: 2,
          minZoom: 2,
          maxZoom: 8,
          worldCopyJump: true,
          scrollWheelZoom: true,
        });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
      const group = L.layerGroup();
      for (const c of cities) {
        const radius = Math.max(8, Math.min(24, 6 + c.count * 2.2));
        const marker = L.circleMarker([c.lat, c.lng], {
          radius,
          color: "#4b6b52",
          weight: 2,
          fillColor: "#b7cdb5",
          fillOpacity: 0.75,
        });
        marker.bindTooltip(
          `<div style="font-weight:600;color:#3a4f3f;font-size:12px">${escapeHtml(c.city_name)}</div>
           <div style="color:#6c7d72;font-size:11px">${c.count} alumni</div>`,
          { direction: "top", offset: [0, -radius], opacity: 1, className: "alumni-tip" }
        );
        const lis = c.alumni
          .slice(0, 6)
          .map(
            (a) =>
              `<li style="margin-bottom:6px;line-height:1.25">
                <a href="/alumni/${a.id}" style="font-weight:600;color:#4b6b52;text-decoration:none">${escapeHtml(a.full_name)}</a>
                <div style="color:#6c7d72;font-size:11px">${escapeHtml(a.role_title ?? "")}${a.company ? ` · ${escapeHtml(a.company)}` : ""}</div>
              </li>`
          )
          .join("");
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
    })();
    return () => {
      cancelled = true;
    };
  }, [cities]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} style={{ height: "100%", width: "100%", background: "#eef2ec" }} />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
