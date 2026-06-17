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
  .alm-pin__shadow { position: absolute; left: 50%; bottom: -2px; transform: translateX(-50%); width: 60%; height: 8px; border-radius: 999px; background: radial-gradient(ellipse at center, rgba(31,36,33,.35) 0%, rgba(31,36,33,0) 70%); animation: alm-shadow 2.4s ease-in-out infinite; }
  .alm-pin__pulse { position: absolute; left: 50%; bottom: 2px; transform: translateX(-50%); width: 56px; height: 24px; border-radius: 999px; background: radial-gradient(ellipse at center, rgba(75,107,82,.32) 0%, rgba(75,107,82,0) 70%); animation: alm-pulse 2.4s ease-out infinite; }
  .alm-pin__pulse--lg { width: 84px; height: 32px; animation-duration: 3s; }
  .alm-pin__body { position: relative; width: 100%; height: 100%; filter: drop-shadow(0 6px 8px rgba(31,66,40,.28)); transition: transform .25s cubic-bezier(.2,.7,.2,1); transform-origin: 50% 100%; animation: alm-bob 2.4s ease-in-out infinite; }
  .alm-pin:hover .alm-pin__body { transform: translateY(-2px) scale(1.08); animation-play-state: paused; }
  .alm-pin__body svg { width: 100%; height: 100%; display: block; overflow: visible; }
  .alm-pin__arm { transform-origin: 32px 30px; animation: alm-wave 1.6s ease-in-out infinite; }
  .alm-pin:hover .alm-pin__arm { animation-duration: .8s; }
  .alm-pin__badge { position: absolute; top: -4px; right: -6px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: #ffffff; color: #34503b; font-weight: 700; font-size: 10px; line-height: 18px; text-align: center; border: 2px solid #34503b; box-shadow: 0 2px 6px -1px rgba(31,66,40,.35); }
  @keyframes alm-pulse {
    0%   { transform: translateX(-50%) scale(.4); opacity: .7; }
    80%  { transform: translateX(-50%) scale(1.6); opacity: 0; }
    100% { transform: translateX(-50%) scale(1.6); opacity: 0; }
  }
  @keyframes alm-shadow {
    0%, 100% { transform: translateX(-50%) scale(1); opacity: .55; }
    50%      { transform: translateX(-50%) scale(.85); opacity: .35; }
  }
  @keyframes alm-bob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-3px); }
  }
  @keyframes alm-wave {
    0%, 100% { transform: rotate(-10deg); }
    50%      { transform: rotate(28deg); }
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
  if (count >= 6) return { w: 56, h: 72, pulse: "lg" } as const;
  if (count >= 3) return { w: 48, h: 62, pulse: "" } as const;
  return { w: 42, h: 54, pulse: "" } as const;
}

// Cute waving cartoon character — sage shirt, friendly face, animated arm
function makePinHtml(count: number) {
  const { w, h, pulse } = pinSize(count);
  return `
    <div class="alm-pin" style="width:${w}px;height:${h}px">
      <div class="alm-pin__pulse ${pulse === "lg" ? "alm-pin__pulse--lg" : ""}"></div>
      <div class="alm-pin__shadow"></div>
      <div class="alm-pin__body">
        <svg viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="shirt${count}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#7ea284"/>
              <stop offset="100%" stop-color="#4b6b52"/>
            </linearGradient>
            <linearGradient id="hair${count}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#4a3320"/>
              <stop offset="100%" stop-color="#2e1f12"/>
            </linearGradient>
          </defs>

          <!-- Legs -->
          <rect x="24" y="60" width="6" height="14" rx="3" fill="#3a4a5a"/>
          <rect x="34" y="60" width="6" height="14" rx="3" fill="#3a4a5a"/>
          <!-- Shoes -->
          <ellipse cx="27" cy="75" rx="5" ry="2.4" fill="#1f2421"/>
          <ellipse cx="37" cy="75" rx="5" ry="2.4" fill="#1f2421"/>

          <!-- Body / shirt -->
          <path d="M18 44 C18 36 22 32 32 32 C42 32 46 36 46 44 L46 60 C46 63 44 64 41 64 L23 64 C20 64 18 63 18 60 Z"
                fill="url(#shirt${count})" stroke="#34503b" stroke-width="1.5"/>
          <!-- Shirt collar V -->
          <path d="M28 32 L32 38 L36 32 Z" fill="#f3f6f1" opacity=".85"/>

          <!-- Left arm (static, at side) -->
          <path d="M19 44 C16 50 16 56 18 60" stroke="#34503b" stroke-width="6" stroke-linecap="round" fill="none"/>
          <circle cx="18" cy="60" r="3.5" fill="#f1c9a5" stroke="#b88a64" stroke-width=".8"/>

          <!-- Right arm (waving) -->
          <g class="alm-pin__arm">
            <path d="M32 30 C42 22 50 16 52 10" stroke="#34503b" stroke-width="6" stroke-linecap="round" fill="none"/>
            <circle cx="52" cy="10" r="4.5" fill="#f1c9a5" stroke="#b88a64" stroke-width=".8"/>
            <!-- tiny fingers hint -->
            <path d="M50 6.5 L51 4 M53 5.5 L54.5 3.5 M55.5 7 L57.5 6" stroke="#b88a64" stroke-width="1" stroke-linecap="round"/>
          </g>

          <!-- Head -->
          <circle cx="32" cy="22" r="13" fill="#f1c9a5" stroke="#b88a64" stroke-width="1"/>
          <!-- Hair -->
          <path d="M19 20 C19 11 25 7 32 7 C39 7 45 11 45 20 C45 18 42 15 38 15 C36 15 35 16 32 16 C29 16 28 15 26 15 C22 15 19 18 19 20 Z"
                fill="url(#hair${count})"/>
          <!-- Ear -->
          <ellipse cx="19.5" cy="23" rx="1.6" ry="2.4" fill="#e5b288"/>

          <!-- Eyes -->
          <circle cx="27.5" cy="23" r="1.5" fill="#1f2421"/>
          <circle cx="36.5" cy="23" r="1.5" fill="#1f2421"/>
          <!-- Eye sparkle -->
          <circle cx="28" cy="22.4" r=".4" fill="#ffffff"/>
          <circle cx="37" cy="22.4" r=".4" fill="#ffffff"/>
          <!-- Cheeks -->
          <circle cx="24" cy="27" r="1.6" fill="#f0a48b" opacity=".55"/>
          <circle cx="40" cy="27" r="1.6" fill="#f0a48b" opacity=".55"/>
          <!-- Smile -->
          <path d="M28.5 28 Q32 31.5 35.5 28" stroke="#1f2421" stroke-width="1.3" stroke-linecap="round" fill="none"/>
        </svg>
        <div class="alm-pin__badge">${count}</div>
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
