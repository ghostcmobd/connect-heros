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

const STYLE_ID = "almanac-map-style";
function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const css = `
  .almanac-map { background:
    radial-gradient(1200px 600px at 20% 0%, #e8f0e6 0%, transparent 60%),
    radial-gradient(900px 500px at 100% 100%, #eef0e4 0%, transparent 55%),
    #f3f6f1; }
  .almanac-map .leaflet-control-attribution { background: rgba(255,255,255,.6); backdrop-filter: blur(6px); font-size: 10px; border-radius: 6px; padding: 2px 6px; }
  .almanac-map .leaflet-control-zoom a { background: #ffffff; color: #4b6b52; border: 1px solid #e1e8dd; box-shadow: 0 2px 8px -4px rgba(75,107,82,.25); transition: transform .15s ease, background .15s ease; }
  .almanac-map .leaflet-control-zoom a:hover { background: #eef2ec; transform: translateY(-1px); }
  .almanac-map .leaflet-popup-content-wrapper { border-radius: 14px; box-shadow: 0 20px 50px -20px rgba(31,36,33,.25); border: 1px solid #e1e8dd; }
  .almanac-map .leaflet-popup-tip { background: #ffffff; }
  .almanac-map .leaflet-tooltip { background: #1f2421; color: #f3f6f1; border: none; border-radius: 8px; padding: 6px 10px; box-shadow: 0 8px 24px -8px rgba(0,0,0,.35); font-size: 12px; }
  .almanac-map .leaflet-tooltip-top:before { border-top-color: #1f2421; }
  .alm-pin { position: relative; transform: translate(-50%, -100%); cursor: pointer; }
  .alm-pin__pulse { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 56px; height: 56px; border-radius: 999px; background: radial-gradient(circle, rgba(75,107,82,.35) 0%, rgba(75,107,82,0) 70%); animation: alm-pulse 2.4s ease-out infinite; }
  .alm-pin__pulse--lg { width: 84px; height: 84px; animation-duration: 3s; }
  .alm-pin__drop { position: relative; width: 38px; height: 46px; filter: drop-shadow(0 8px 12px rgba(31,66,40,.35)); transition: transform .2s cubic-bezier(.2,.7,.2,1); }
  .alm-pin:hover .alm-pin__drop { transform: translateY(-3px) scale(1.06); }
  .alm-pin__drop svg { width: 100%; height: 100%; display: block; }
  .alm-pin__count { position: absolute; left: 50%; top: 16px; transform: translateX(-50%); color: #ffffff; font-weight: 700; font-size: 12px; letter-spacing: .01em; text-shadow: 0 1px 2px rgba(0,0,0,.25); }
  @keyframes alm-pulse {
    0%   { transform: translate(-50%, -50%) scale(.4); opacity: .85; }
    80%  { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
    100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
  }
  .alm-popup { min-width: 220px; font-family: inherit; }
  .alm-popup__title { font-weight: 700; color: #1f2421; font-size: 14px; letter-spacing: -0.01em; }
  .alm-popup__sub { color: #6c7d72; font-size: 11px; margin: 2px 0 10px; display: flex; align-items: center; gap: 6px; }
  .alm-popup__dot { display: inline-block; width: 6px; height: 6px; border-radius: 999px; background: #4b6b52; box-shadow: 0 0 0 3px rgba(75,107,82,.18); }
  .alm-popup__list { list-style: none; padding: 0; margin: 0; font-size: 12px; }
  .alm-popup__item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 0; border-top: 1px solid #eef2ec; }
  .alm-popup__item:first-child { border-top: none; }
  .alm-popup__avatar { width: 26px; height: 26px; border-radius: 999px; background: #eef2ec; color: #4b6b52; display: grid; place-items: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .alm-popup__name { font-weight: 600; color: #1f2421; text-decoration: none; line-height: 1.2; }
  .alm-popup__name:hover { color: #4b6b52; }
  .alm-popup__role { color: #6c7d72; font-size: 11px; line-height: 1.25; }
  .alm-popup__more { font-size: 11px; color: #4b6b52; padding-top: 6px; display: block; text-align: center; font-weight: 600; }
  `;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = css;
  document.head.appendChild(tag);
}

function initials(name: string) {
  return name.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function pinSize(count: number) {
  if (count >= 6) return { drop: 52, badge: 24, pulse: "lg" } as const;
  if (count >= 3) return { drop: 44, badge: 20, pulse: "" } as const;
  return { drop: 38, badge: 18, pulse: "" } as const;
}

function makePinHtml(count: number) {
  const { drop, pulse } = pinSize(count);
  // Teardrop SVG with sage gradient + soft highlight
  return `
    <div class="alm-pin" style="width:${drop}px;height:${drop + 8}px">
      <div class="alm-pin__pulse ${pulse === "lg" ? "alm-pin__pulse--lg" : ""}"></div>
      <div class="alm-pin__drop" style="width:${drop}px;height:${drop + 8}px">
        <svg viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g${count}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6f9075"/>
              <stop offset="55%" stop-color="#4b6b52"/>
              <stop offset="100%" stop-color="#34503b"/>
            </linearGradient>
            <radialGradient id="h${count}" cx="35%" cy="30%" r="40%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity=".55"/>
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <path d="M20 1 C9.5 1 1.5 9 1.5 19 C1.5 31 14 41 19 47 C19.5 47.6 20.5 47.6 21 47 C26 41 38.5 31 38.5 19 C38.5 9 30.5 1 20 1 Z"
                fill="url(#g${count})" stroke="#ffffff" stroke-width="2"/>
          <path d="M20 1 C9.5 1 1.5 9 1.5 19 C1.5 31 14 41 19 47 C19.5 47.6 20.5 47.6 21 47 C26 41 38.5 31 38.5 19 C38.5 9 30.5 1 20 1 Z"
                fill="url(#h${count})"/>
        </svg>
        <div class="alm-pin__count">${count}</div>
      </div>
    </div>
  `;
}

export function AlumniMap({ cities }: { cities: CityPin[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    injectStyles();
    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [25, 10], zoom: 2, minZoom: 2, maxZoom: 8,
          worldCopyJump: true, scrollWheelZoom: true, zoomControl: true,
          zoomAnimation: true, fadeAnimation: true, markerZoomAnimation: true,
        });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: "abcd",
        }).addTo(mapRef.current);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
          subdomains: "abcd",
          pane: "shadowPane",
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;
      if (layerRef.current) map.removeLayer(layerRef.current);
      const group = L.layerGroup();

      for (const c of cities) {
        const { drop } = pinSize(c.count);
        const icon = L.divIcon({
          className: "alm-pin-wrap",
          html: makePinHtml(c.count),
          iconSize: [drop, drop + 8],
          iconAnchor: [drop / 2, drop + 6],
          popupAnchor: [0, -drop],
          tooltipAnchor: [0, -drop + 4],
        });
        const marker = L.marker([c.lat, c.lng], { icon, riseOnHover: true });
        marker.bindTooltip(
          `<strong style="font-weight:600">${escapeHtml(c.city_name)}</strong> · ${c.count} alumni`,
          { direction: "top", offset: [0, -6], opacity: 1 }
        );
        const items = c.alumni.slice(0, 5).map((a) =>
          `<li class="alm-popup__item">
             <div class="alm-popup__avatar">${escapeHtml(initials(a.full_name))}</div>
             <div style="min-width:0">
               <a class="alm-popup__name" href="/alumni/${a.id}">${escapeHtml(a.full_name)}</a>
               <div class="alm-popup__role">${escapeHtml(a.role_title ?? "")}${a.company ? ` · ${escapeHtml(a.company)}` : ""}</div>
             </div>
           </li>`
        ).join("");
        const more = c.alumni.length > 5
          ? `<a class="alm-popup__more" href="/directory?city=${encodeURIComponent(c.city_name)}">+ ${c.alumni.length - 5} more in ${escapeHtml(c.city_name)}</a>`
          : "";
        marker.bindPopup(
          `<div class="alm-popup">
            <div class="alm-popup__title">${escapeHtml(c.city_name)}</div>
            <div class="alm-popup__sub"><span class="alm-popup__dot"></span> ${c.count} alumni</div>
            <ul class="alm-popup__list">${items}</ul>
            ${more}
          </div>`,
          { closeButton: false, autoPanPadding: [24, 24] }
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

  return <div ref={containerRef} className="almanac-map" style={{ height: "100%", width: "100%" }} />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
