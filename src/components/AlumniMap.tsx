import { useEffect, useRef, useState } from "react";
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
    radial-gradient(1200px 600px at 20% 0%, #e8efdf 0%, transparent 60%),
    radial-gradient(900px 500px at 100% 100%, #f0e8cf 0%, transparent 55%),
    #f5f0e0; }
  .almanac-map .leaflet-control-attribution { background: rgba(245,240,224,.7); backdrop-filter: blur(6px); font-size: 10px; border-radius: 6px; padding: 2px 6px; color: #064e3b; }
  .almanac-map .leaflet-control-zoom a { background: #f5f0e0; color: #064e3b; border: 1px solid rgba(201,168,76,.4); box-shadow: 0 2px 8px -4px rgba(6,78,59,.25); transition: transform .15s ease, background .15s ease; }
  .almanac-map .leaflet-control-zoom a:hover { background: #ffffff; transform: translateY(-1px); border-color: #c9a84c; }
  .almanac-map .leaflet-popup-content-wrapper { border-radius: 18px; box-shadow: 0 22px 50px -22px rgba(6,78,59,.4); border: 1px solid rgba(201,168,76,.3); background: #f5f0e0; }
  .almanac-map .leaflet-popup-tip { background: #f5f0e0; }
  .almanac-map .leaflet-tooltip { background: #064e3b; color: #f5f0e0; border: none; border-radius: 8px; padding: 6px 10px; box-shadow: 0 8px 24px -8px rgba(6,78,59,.4); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  .almanac-map .leaflet-tooltip-top:before { border-top-color: #064e3b; }
  .alm-pin { position: relative; transform: translate(-50%, -100%); cursor: pointer; }
  .alm-pin__shadow { position: absolute; left: 50%; bottom: -3px; transform: translateX(-50%); width: 55%; height: 6px; border-radius: 999px; background: radial-gradient(ellipse at center, rgba(6,78,59,.5) 0%, rgba(6,78,59,0) 70%); animation: alm-shadow 2.6s ease-in-out infinite; }
  .alm-pin__pulse { position: absolute; left: 50%; bottom: -1px; transform: translateX(-50%); width: 38px; height: 14px; border-radius: 999px; background: radial-gradient(ellipse at center, rgba(201,168,76,.55) 0%, rgba(201,168,76,0) 70%); animation: alm-pulse 2.6s ease-out infinite; }
  .alm-pin__pulse--lg { width: 56px; height: 20px; animation-duration: 3s; }
  .alm-pin__body { position: relative; width: 100%; height: 100%; filter: drop-shadow(0 4px 6px rgba(6,78,59,.35)); transition: transform .25s cubic-bezier(.2,.7,.2,1); transform-origin: 50% 100%; animation: alm-bob 3s ease-in-out infinite; }
  .alm-pin:hover .alm-pin__body { transform: translateY(-3px) scale(1.08); animation-play-state: paused; }
  .alm-pin__body svg { width: 100%; height: 100%; display: block; overflow: visible; }
  .alm-pin__count { position: absolute; top: 22%; left: 50%; transform: translateX(-50%); color: #f5f0e0; font-weight: 800; font-size: 12px; line-height: 1; font-family: 'Urbanist Variable', sans-serif; letter-spacing: -.02em; pointer-events: none; text-shadow: 0 1px 2px rgba(6,78,59,.5); }
  .alm-pin__count--lg { font-size: 15px; top: 24%; }
  @keyframes alm-pulse {
    0%   { transform: translateX(-50%) scale(.4); opacity: .8; }
    80%  { transform: translateX(-50%) scale(1.7); opacity: 0; }
    100% { transform: translateX(-50%) scale(1.7); opacity: 0; }
  }
  @keyframes alm-shadow {
    0%, 100% { transform: translateX(-50%) scale(1); opacity: .6; }
    50%      { transform: translateX(-50%) scale(.8); opacity: .35; }
  }
  @keyframes alm-bob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-2px); }
  }

  .alm-popup { min-width: 220px; font-family: 'Epilogue Variable', sans-serif; }
  .alm-popup__title { font-family: 'Urbanist Variable', sans-serif; font-weight: 900; color: #064e3b; font-size: 15px; letter-spacing: -0.01em; }
  .alm-popup__sub { color: #c9a84c; font-size: 10px; margin: 2px 0 10px; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700; }
  .alm-popup__dot { display: inline-block; width: 6px; height: 6px; border-radius: 999px; background: #c9a84c; box-shadow: 0 0 0 3px rgba(201,168,76,.25); }
  .alm-popup__list { list-style: none; padding: 0; margin: 0; font-size: 12px; }
  .alm-popup__item { display: flex; align-items: flex-start; gap: 8px; padding: 7px 0; border-top: 1px solid rgba(6,78,59,.1); }
  .alm-popup__item:first-child { border-top: none; }
  .alm-popup__avatar { width: 28px; height: 28px; border-radius: 999px; background: #064e3b; color: #c9a84c; display: grid; place-items: center; font-size: 10px; font-weight: 800; flex-shrink: 0; font-family: 'Urbanist Variable', sans-serif; }
  .alm-popup__name { font-weight: 700; color: #064e3b; text-decoration: none; line-height: 1.2; font-family: 'Urbanist Variable', sans-serif; }
  .alm-popup__name:hover { color: #c9a84c; }
  .alm-popup__role { color: #0d7a5f; font-size: 11px; line-height: 1.25; }
  .alm-popup__more { font-size: 10px; color: #c9a84c; padding-top: 8px; display: block; text-align: center; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; }
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
  if (count >= 6) return { w: 38, h: 50, pulse: "lg", lg: true } as const;
  if (count >= 3) return { w: 32, h: 42, pulse: "", lg: false } as const;
  return { w: 26, h: 34, pulse: "", lg: false } as const;
}

// Clean modern map pin — emerald body with gold accent ring, count inside
function makePinHtml(count: number) {
  const { w, h, pulse, lg } = pinSize(count);
  const isGold = count >= 6;
  const fillTop = isGold ? "#e6c772" : "#0d7a5f";
  const fillBot = isGold ? "#a6802e" : "#064e3b";
  const ring = isGold ? "#fff3d1" : "#c9a84c";
  const stroke = isGold ? "#7d5e1e" : "#04332a";
  const uid = `${count}-${isGold ? "g" : "e"}`;
  return `
    <div class="alm-pin" style="width:${w}px;height:${h}px">
      <div class="alm-pin__pulse ${pulse === "lg" ? "alm-pin__pulse--lg" : ""}"></div>
      <div class="alm-pin__shadow"></div>
      <div class="alm-pin__body">
        <svg viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pin${uid}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${fillTop}"/>
              <stop offset="100%" stop-color="${fillBot}"/>
            </linearGradient>
          </defs>
          <path d="M20 1.5 C29.94 1.5 37.5 9.06 37.5 19 C37.5 27.5 31 35 22.5 47.5 C21.2 49.4 18.8 49.4 17.5 47.5 C9 35 2.5 27.5 2.5 19 C2.5 9.06 10.06 1.5 20 1.5 Z"
                fill="url(#pin${uid})" stroke="${stroke}" stroke-width="1.4"/>
          <circle cx="20" cy="19" r="8.5" fill="none" stroke="${ring}" stroke-width="1.6" opacity=".95"/>
          <circle cx="20" cy="19" r="5.2" fill="${ring}" opacity=".18"/>
        </svg>
        <div class="alm-pin__count ${lg ? "alm-pin__count--lg" : ""}">${count}</div>
      </div>
    </div>
  `;
}


function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function AlumniMap({ cities }: { cities: CityPin[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const meMarkerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [nearbyMsg, setNearbyMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    injectStyles();
    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current) return;
      LRef.current = L;
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [25, 10], zoom: 2, minZoom: 2, maxZoom: 12,
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

  const findNearMe = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setNearbyMsg("Geolocation is not supported on this device.");
      return;
    }
    setLocating(true);
    setNearbyMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const L = LRef.current;
        const map = mapRef.current;
        if (!L || !map) return;
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        const working = cities.flatMap((c) =>
          c.alumni
            .filter((a) => !!a.company)
            .map((a) => ({ ...a, city: c.city_name, lat: c.lat, lng: c.lng, km: haversineKm(me, c) }))
        ).sort((a, b) => a.km - b.km).slice(0, 5);

        const meIcon = L.divIcon({
          className: "alm-me-wrap",
          html: `<div style="position:relative;width:22px;height:22px">
              <div style="position:absolute;inset:0;border-radius:999px;background:rgba(13,122,95,.3);animation:alm-pulse 2s ease-out infinite"></div>
              <div style="position:absolute;inset:5px;border-radius:999px;background:#0d7a5f;border:2px solid #f5f0e0;box-shadow:0 4px 12px rgba(6,78,59,.45)"></div>
            </div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -10],
        });
        if (meMarkerRef.current) map.removeLayer(meMarkerRef.current);
        meMarkerRef.current = L.marker([me.lat, me.lng], { icon: meIcon, zIndexOffset: 1000 });

        const list = working.length
          ? working.map((a) =>
              `<li class="alm-popup__item">
                 <div class="alm-popup__avatar">${escapeHtml(initials(a.full_name))}</div>
                 <div style="min-width:0;flex:1">
                   <a class="alm-popup__name" href="/alumni/${a.id}">${escapeHtml(a.full_name)}</a>
                   <div class="alm-popup__role">${escapeHtml(a.role_title ?? "")}${a.company ? ` · ${escapeHtml(a.company)}` : ""}</div>
                   <div class="alm-popup__role" style="color:#c9a84c;font-weight:700">${escapeHtml(a.city)} · ${Math.round(a.km)} km</div>
                 </div>
               </li>`
            ).join("")
          : `<li class="alm-popup__item"><div class="alm-popup__role">No working alumni found yet.</div></li>`;

        meMarkerRef.current.bindPopup(
          `<div class="alm-popup">
            <div class="alm-popup__title">You are here</div>
            <div class="alm-popup__sub"><span class="alm-popup__dot"></span> Nearest working alumni</div>
            <ul class="alm-popup__list">${list}</ul>
          </div>`,
          { closeButton: false, autoPanPadding: [24, 24] }
        ).addTo(map);

        map.flyTo([me.lat, me.lng], working[0] ? 5 : 7, { duration: 1.2 });
        setTimeout(() => meMarkerRef.current?.openPopup(), 1300);
        setNearbyMsg(working[0] ? `Nearest: ${working[0].full_name} · ${Math.round(working[0].km)} km` : "No working alumni nearby yet.");
      },
      (err) => {
        setLocating(false);
        setNearbyMsg(err.code === err.PERMISSION_DENIED ? "Location permission denied." : "Couldn't get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="almanac-map" style={{ height: "100%", width: "100%" }} />
      <button
        type="button"
        onClick={findNearMe}
        disabled={locating}
        className="absolute bottom-3 left-3 z-[450] inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/50 bg-primary/90 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--parchment)] shadow-lg backdrop-blur-md transition hover:bg-primary disabled:opacity-60"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-[color:var(--gold)] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--gold)]" />
        </span>
        {locating ? "Locating…" : "Find alumni near me"}
      </button>
      {nearbyMsg && (
        <div className="pointer-events-none absolute bottom-12 left-3 z-[450] max-w-[80%] rounded-md border border-[color:var(--gold)]/40 bg-primary/85 px-2.5 py-1 font-display text-[10px] font-semibold text-[color:var(--parchment)] backdrop-blur-md">
          {nearbyMsg}
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
