import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from "react-leaflet";
import { Link } from "@tanstack/react-router";
import type { CityPin } from "@/lib/site.functions";

export function AlumniMap({ cities }: { cities: CityPin[] }) {
  return (
    <MapContainer
      center={[25, 10]}
      zoom={2}
      minZoom={2}
      maxZoom={8}
      worldCopyJump
      scrollWheelZoom
      style={{ height: "100%", width: "100%", background: "oklch(0.97 0.01 140)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {cities.map((c) => {
        const radius = Math.max(8, Math.min(24, 6 + c.count * 2.2));
        return (
          <CircleMarker
            key={c.city_name}
            center={[c.lat, c.lng]}
            radius={radius}
            pathOptions={{
              color: "oklch(0.42 0.045 145)",
              weight: 2,
              fillColor: "oklch(0.82 0.04 145)",
              fillOpacity: 0.75,
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]} opacity={1} className="!rounded-lg !border-0 !bg-white !px-3 !py-1.5 !shadow-md">
              <div className="text-[12px] font-semibold text-[oklch(0.32_0.03_150)]">{c.city_name}</div>
              <div className="text-[11px] text-[oklch(0.5_0.015_150)]">{c.count} alumni</div>
            </Tooltip>
            <Popup className="alumni-popup">
              <div className="min-w-[200px] p-1">
                <div className="text-sm font-semibold text-[oklch(0.32_0.03_150)]">{c.city_name}</div>
                <div className="mb-2 text-xs text-[oklch(0.5_0.015_150)]">{c.count} alumni</div>
                <ul className="space-y-1.5">
                  {c.alumni.slice(0, 6).map((a) => (
                    <li key={a.id} className="text-xs leading-tight">
                      <Link to="/alumni/$id" params={{ id: a.id }} className="font-medium text-[oklch(0.42_0.045_145)] hover:underline">
                        {a.full_name}
                      </Link>
                      <div className="text-[oklch(0.5_0.015_150)]">
                        {a.role_title}
                        {a.company ? ` · ${a.company}` : ""}
                      </div>
                    </li>
                  ))}
                  {c.alumni.length > 6 && (
                    <li className="text-[11px] text-[oklch(0.5_0.015_150)]">+ {c.alumni.length - 6} more</li>
                  )}
                </ul>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
