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
  .alm-pin__arm { transform-origin: 32px 32px; animation: alm-wave 1.6s ease-in-out infinite; }
  .alm-pin:hover .alm-pin__arm { animation-duration: .7s; }
  .alm-pin__badge { position: absolute; top: -3px; right: -4px; min-width: 14px; height: 14px; padding: 0 4px; border-radius: 999px; background: #ffffff; color: #34503b; font-weight: 700; font-size: 9px; line-height: 14px; text-align: center; border: 1.5px solid #34503b; box-shadow: 0 1px 4px rgba(31,66,40,.3); }
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
  if (count >= 6) return { w: 40, h: 52, pulse: "lg" } as const;
  if (count >= 3) return { w: 34, h: 44, pulse: "" } as const;
  return { w: 28, h: 36, pulse: "" } as const;
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
              <stop offset="0%" stop-color="#86a98c"/>
              <stop offset="100%" stop-color="#4b6b52"/>
            </linearGradient>
            <radialGradient id="head${count}" cx="40%" cy="40%" r="65%">
              <stop offset="0%" stop-color="#fbdec1"/>
              <stop offset="100%" stop-color="#edc29c"/>
            </radialGradient>
          </defs>

          <!-- Legs (short, chibi) -->
          <rect x="26" y="62" width="4.5" height="9" rx="2.25" fill="#2d3b4a"/>
          <rect x="33.5" y="62" width="4.5" height="9" rx="2.25" fill="#2d3b4a"/>
          <!-- Shoes -->
          <ellipse cx="28.2" cy="72" rx="4" ry="2" fill="#1f2421"/>
          <ellipse cx="35.8" cy="72" rx="4" ry="2" fill="#1f2421"/>

          <!-- Body / round chibi shirt -->
          <path d="M19 50 C19 41 24 37 32 37 C40 37 45 41 45 50 L45 60 C45 63 43 64 40 64 L24 64 C21 64 19 63 19 60 Z"
                fill="url(#shirt${count})" stroke="#34503b" stroke-width="1.2"/>
          <!-- Subtle shirt highlight -->
          <path d="M23 44 C26 41 30 40 32 40" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".35"/>

          <!-- Left arm (resting) -->
          <path d="M21 48 C18 53 18 58 20 61" stroke="#4b6b52" stroke-width="4.5" stroke-linecap="round" fill="none"/>
          <circle cx="20" cy="61" r="2.8" fill="url(#head${count})" stroke="#b88a64" stroke-width=".6"/>

          <!-- Right arm (waving) — pivot at shoulder -->
          <g class="alm-pin__arm">
            <path d="M43 44 C49 36 54 30 55 24" stroke="#4b6b52" stroke-width="4.5" stroke-linecap="round" fill="none"/>
            <circle cx="55" cy="23" r="3.4" fill="url(#head${count})" stroke="#b88a64" stroke-width=".6"/>
            <path d="M53.5 20.5 L54 18 M55.5 19.8 L56.5 17.8 M57 21 L58.5 20.2" stroke="#b88a64" stroke-width=".7" stroke-linecap="round"/>
          </g>

          <!-- Head — larger, chibi -->
          <circle cx="32" cy="24" r="15" fill="url(#head${count})" stroke="#b88a64" stroke-width=".9"/>

          <!-- Hair cap -->
          <path d="M17.5 22 C17.5 12 24 7 32 7 C40 7 46.5 12 46.5 22 C46.5 19.5 43.5 17 39 17 C36.5 17 35.5 18.5 32 18.5 C28.5 18.5 27.5 17 25 17 C20.5 17 17.5 19.5 17.5 22 Z"
                fill="#3a2818"/>
          <!-- Hair highlight -->
          <path d="M22 14 C25 11 28 10 31 10" stroke="#5a4028" stroke-width="1" stroke-linecap="round" fill="none" opacity=".7"/>
          <!-- Ear -->
          <ellipse cx="18" cy="25" rx="1.4" ry="2.2" fill="#e5b288"/>

          <!-- Eyes (chibi big) -->
          <ellipse cx="27" cy="25.5" rx="1.6" ry="2" fill="#1f2421"/>
          <ellipse cx="37" cy="25.5" rx="1.6" ry="2" fill="#1f2421"/>
          <!-- Eye sparkles -->
          <circle cx="27.5" cy="24.6" r=".55" fill="#ffffff"/>
          <circle cx="37.5" cy="24.6" r=".55" fill="#ffffff"/>
          <!-- Brows -->
          <path d="M25 22 Q27 21 29 22" stroke="#3a2818" stroke-width=".9" stroke-linecap="round" fill="none"/>
          <path d="M35 22 Q37 21 39 22" stroke="#3a2818" stroke-width=".9" stroke-linecap="round" fill="none"/>
          <!-- Cheeks -->
          <circle cx="24" cy="30" r="1.8" fill="#f29a85" opacity=".55"/>
          <circle cx="40" cy="30" r="1.8" fill="#f29a85" opacity=".55"/>
          <!-- Smile -->
          <path d="M28.5 30.5 Q32 33.5 35.5 30.5" stroke="#1f2421" stroke-width="1.2" stroke-linecap="round" fill="none"/>
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
        const { w, h } = pinSize(c.count);
        const icon = L.divIcon({
          className: "alm-pin-wrap",
          html: makePinHtml(c.count),
          iconSize: [w, h],
          iconAnchor: [w / 2, h - 2],
          popupAnchor: [0, -h + 8],
          tooltipAnchor: [0, -h + 12],
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
