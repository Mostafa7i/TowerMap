"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import("react-leaflet").then(m => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import("react-leaflet").then(m => m.Marker),       { ssr: false });
const Popup        = dynamic(() => import("react-leaflet").then(m => m.Popup),        { ssr: false });
const useMap       = dynamic(() => import("react-leaflet").then(m => m.useMap),       { ssr: false });

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  normal:   { color: "#10b981", glow: "#10b98180", label: "طبيعي",   emoji: "🟢", bg: "#10b98115", border: "#10b98135" },
  warning:  { color: "#f59e0b", glow: "#f59e0b80", label: "تحذير",   emoji: "🟡", bg: "#f59e0b15", border: "#f59e0b35" },
  critical: { color: "#ef4444", glow: "#ef444480", label: "حرج",     emoji: "🔴", bg: "#ef444415", border: "#ef444435" },
  unknown:  { color: "#64748b", glow: "#64748b80", label: "غير معروف",emoji: "⚫", bg: "#64748b15", border: "#64748b35" },
};

function getStatusKey(tower) {
  if (tower.status && STATUS[tower.status]) return tower.status;
  const lat = tower.lastMeasurement?.latency;
  const pl  = tower.lastMeasurement?.packetLoss;
  if (lat == null && pl == null) return "unknown";
  if (lat > 200 || pl > 20) return "critical";
  if (lat > 80  || pl > 5)  return "warning";
  return "normal";
}

function getStatus(tower) {
  return STATUS[getStatusKey(tower)] || STATUS.unknown;
}

function getHealthScore(m) {
  if (!m) return null;
  const latScore = Math.max(0, 100 - (m.latency / 2));
  const plScore  = Math.max(0, 100 - m.packetLoss * 10);
  const jitScore = Math.max(0, 100 - m.jitter * 5);
  const thrScore = Math.min(100, (m.throughput / 100) * 100);
  return ((latScore + plScore + jitScore + thrScore) / 4).toFixed(0);
}

// ─── Custom marker HTML ───────────────────────────────────────────────────────
function buildMarkerHTML(color, glow, isCritical, isSelected) {
  const pulse = isCritical
    ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};animation:markerPulse 1.5s infinite;opacity:0.5;"></div>`
    : "";
  const ring = isSelected
    ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid white;opacity:0.8;"></div>`
    : "";
  return `
    <div style="position:relative;width:36px;height:36px">
      ${pulse}
      ${ring}
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:${color};
        border:3px solid rgba(255,255,255,0.9);
        box-shadow:0 0 16px ${glow}, 0 2px 8px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
        font-size:16px;
      ">📡</div>
    </div>
  `;
}

// ─── Map style toggle (dark tiles) ───────────────────────────────────────────
const TILE_LAYERS = {
  dark:  { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",   label: "داكن" },
  light: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",              label: "فاتح" },
  sat:   { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", label: "قمر صناعي" },
};

// ─── FlyTo helper component ───────────────────────────────────────────────────
function MapFlyTo({ target }) {
  // dynamically use the hook only client-side
  const [mapRef, setMapRef] = useState(null);

  // We can't use useMap hook directly in a dynamic import scenario easily,
  // so we store it via a ref pattern via the parent.
  useEffect(() => {
    if (target && mapRef) {
      mapRef.flyTo([target.location.lat, target.location.lng], 13, { duration: 1.2 });
    }
  }, [target, mapRef]);

  return null;
}

// ─── Popup Card ───────────────────────────────────────────────────────────────
function PopupCard({ tower, aiResult }) {
  const s   = getStatus(tower);
  const m   = tower.lastMeasurement;
  const health = getHealthScore(m);
  const prob = aiResult ? parseFloat(aiResult.probability) : null;
  const riskColor = prob == null ? "#64748b" : prob >= 75 ? "#ef4444" : prob >= 50 ? "#f97316" : prob >= 25 ? "#f59e0b" : "#10b981";

  const rows = [
    { label: "Latency",    value: m?.latency    != null ? `${m.latency} ms`    : "—", color: "#38bdf8" },
    { label: "Packet Loss",value: m?.packetLoss != null ? `${m.packetLoss}%`   : "—", color: "#f87171" },
    { label: "Jitter",     value: m?.jitter     != null ? `${m.jitter} ms`     : "—", color: "#a78bfa" },
    { label: "Throughput", value: m?.throughput != null ? `${m.throughput} Mbps`: "—", color: "#34d399" },
  ];

  return (
    <div style={{
      fontFamily: "'Tajawal', sans-serif",
      direction: "rtl",
      background: "#0a1628",
      border: `1px solid ${s.border}`,
      borderRadius: 14,
      padding: "16px",
      minWidth: 240,
      maxWidth: 280,
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 24px ${s.glow}20`,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: s.bg, border: `1px solid ${s.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>📡</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {tower.TowerName || tower.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block", boxShadow: `0 0 6px ${s.color}` }} />
            <span style={{ fontSize: 10, color: s.color, fontFamily: "monospace" }}>{s.label}</span>
            {tower.vendor && <span style={{ fontSize: 9, color: "#334155", fontFamily: "monospace" }}>· {tower.vendor}</span>}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
        {rows.map(r => (
          <div key={r.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 10px" }}>
            <p style={{ margin: 0, fontSize: 9, color: "#475569", fontFamily: "monospace", marginBottom: 2 }}>{r.label}</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: r.color, fontFamily: "monospace" }}>{r.value}</p>
          </div>
        ))}
      </div>

      {/* Health + AI Risk */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {health && (
          <div style={{ flex: 1, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 10px" }}>
            <p style={{ margin: 0, fontSize: 9, color: "#475569", fontFamily: "monospace", marginBottom: 4 }}>Network Health</p>
            <div style={{ height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${health}%`, borderRadius: 2, background: health >= 70 ? "#10b981" : health >= 40 ? "#f59e0b" : "#ef4444", boxShadow: `0 0 6px ${health >= 70 ? "#10b981" : health >= 40 ? "#f59e0b" : "#ef4444"}` }} />
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 700, color: health >= 70 ? "#10b981" : health >= 40 ? "#f59e0b" : "#ef4444", fontFamily: "monospace" }}>{health}%</p>
          </div>
        )}
        {prob != null && (
          <div style={{ flex: 1, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 10px" }}>
            <p style={{ margin: 0, fontSize: 9, color: "#475569", fontFamily: "monospace", marginBottom: 4 }}>AI Risk</p>
            <div style={{ height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${prob}%`, borderRadius: 2, background: riskColor, boxShadow: `0 0 6px ${riskColor}` }} />
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 700, color: riskColor, fontFamily: "monospace" }}>{prob.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1e293b", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {tower.ip_address && (
          <span style={{ fontSize: 9, color: "#334155", fontFamily: "monospace" }}>{tower.ip_address}</span>
        )}
        <span style={{ fontSize: 9, color: "#1e293b", fontFamily: "monospace" }}>
          {tower.updatedAt ? new Date(tower.updatedAt).toLocaleTimeString("ar-EG") : "—"}
        </span>
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function MapLegend({ counts }) {
  return (
    <div style={{
      position: "absolute", bottom: 24, right: 12, zIndex: 999,
      background: "rgba(10,22,40,0.95)", border: "1px solid #1e293b",
      borderRadius: 12, padding: "12px 16px", backdropFilter: "blur(10px)",
      fontFamily: "'Tajawal', sans-serif", direction: "rtl",
    }}>
      <p style={{ fontSize: 9, color: "#334155", fontFamily: "monospace", letterSpacing: 2, margin: "0 0 8px", textTransform: "uppercase" }}>
        مفتاح الخريطة
      </p>
      {Object.entries(STATUS).filter(([k]) => k !== "unknown").map(([key, s]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, display: "inline-block", boxShadow: `0 0 6px ${s.color}` }} />
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</span>
          <span style={{ fontSize: 10, color: "#334155", fontFamily: "monospace", marginRight: "auto" }}>
            ({counts[key] || 0})
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TowerMap({ towers = [], towerAiResults = {} }) {
  const [L, setL]               = useState(null);
  const [tileKey, setTileKey]   = useState("dark");
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [mapRef, setMapRef]     = useState(null);
  const [showPanel, setShowPanel] = useState(true);

  // ── Leaflet init ──
  useEffect(() => {
    let mounted = true;
    import("leaflet").then(leaflet => {
      if (!mounted) return;
      const Lref = leaflet.default;
      delete Lref.Icon.Default.prototype._getIconUrl;
      Lref.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setL(Lref);
    });
    return () => { mounted = false; };
  }, []);

  // ── Fly to selected ──
  useEffect(() => {
    if (selected && mapRef) {
      mapRef.flyTo([selected.location.lat, selected.location.lng], 13, { duration: 1.2 });
    }
  }, [selected, mapRef]);

  const getIcon = useCallback((tower) => {
    if (!L) return null;
    const s = getStatus(tower);
    const isCrit = s === STATUS.critical;
    const isSel  = selected?._id === tower._id;
    return L.divIcon({
      className: "",
      html: buildMarkerHTML(s.color, s.glow, isCrit, isSel),
      iconSize:    [36, 36],
      iconAnchor:  [18, 18],
      popupAnchor: [0, -22],
    });
  }, [L, selected]);

  if (!L) return (
    <div style={{ height: "100%", width: "100%", background: "#020c1b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid #0ea5e9", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#334155", fontFamily: "monospace", fontSize: 12 }}>LOADING MAP...</p>
      </div>
    </div>
  );

  // Counts
  const counts = { normal: 0, warning: 0, critical: 0, unknown: 0 };
  towers.forEach(t => {
    const k = getStatusKey(t);
    counts[k] = (counts[k] || 0) + 1;
  });

  // Filter + search
  const visible = towers.filter(t => {
    const matchStatus = filter === "all" || getStatusKey(t) === filter;
    const matchSearch = !search || (t.TowerName || t.name || "").toLowerCase().includes(search.toLowerCase()) || (t.ip_address || "").includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes markerPulse { 0%{transform:scale(1);opacity:0.6} 70%{transform:scale(2.2);opacity:0} 100%{transform:scale(1);opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .leaflet-popup-content-wrapper { background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important; }
        .leaflet-popup-content { margin:0!important; }
        .leaflet-popup-tip-container { display:none!important; }
        .leaflet-container { background:#020c1b; }
        .map-panel-btn:hover { background: rgba(14,165,233,0.15)!important; }
      `}</style>

      <div style={{ position: "relative", height: "100%", width: "100%", fontFamily: "'Tajawal', sans-serif" }}>

        {/* ── Top Control Bar ── */}
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, display: "flex", alignItems: "center", gap: 8,
          background: "rgba(10,22,40,0.95)", border: "1px solid #1e293b",
          borderRadius: 14, padding: "8px 12px", backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن برج..."
            style={{
              background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8,
              padding: "6px 12px", color: "#e2e8f0", fontSize: 12,
              fontFamily: "'Tajawal', sans-serif", outline: "none", width: 160,
              direction: "rtl",
            }}
          />

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "#1e293b" }} />

          {/* Status filters */}
          {["all", "normal", "warning", "critical"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="map-panel-btn"
              style={{
                background: filter === f ? "rgba(14,165,233,0.15)" : "transparent",
                border: `1px solid ${filter === f ? "#0ea5e940" : "transparent"}`,
                borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                color: filter === f ? "#38bdf8" : "#475569",
                fontSize: 11, fontFamily: "'Tajawal', sans-serif", fontWeight: 700,
                transition: "all 0.2s",
              }}>
              {f === "all" ? `الكل (${towers.length})` : f === "normal" ? `🟢 ${counts.normal}` : f === "warning" ? `🟡 ${counts.warning}` : `🔴 ${counts.critical}`}
            </button>
          ))}

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "#1e293b" }} />

          {/* Tile layer toggle */}
          {Object.entries(TILE_LAYERS).map(([key, t]) => (
            <button key={key} onClick={() => setTileKey(key)}
              className="map-panel-btn"
              style={{
                background: tileKey === key ? "rgba(99,102,241,0.15)" : "transparent",
                border: `1px solid ${tileKey === key ? "#6366f140" : "transparent"}`,
                borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                color: tileKey === key ? "#a78bfa" : "#475569",
                fontSize: 11, fontFamily: "monospace",
                transition: "all 0.2s",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Side Panel ── */}
        {showPanel && (
          <div style={{
            position: "absolute", top: 72, right: 12, zIndex: 1000,
            background: "rgba(10,22,40,0.95)", border: "1px solid #1e293b",
            borderRadius: 14, backdropFilter: "blur(12px)",
            width: 220, maxHeight: "calc(100% - 130px)", overflow: "hidden",
            display: "flex", flexDirection: "column",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: 10, color: "#334155", fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase" }}>
                الأبراج ({visible.length})
              </p>
              <button onClick={() => setShowPanel(false)}
                style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {visible.length === 0 ? (
                <p style={{ padding: 16, color: "#334155", fontFamily: "monospace", fontSize: 11, textAlign: "center" }}>لا توجد نتائج</p>
              ) : visible.map(tw => {
                const s = getStatus(tw);
                const isSel = selected?._id === tw._id;
                const ai = towerAiResults?.[tw._id];
                const prob = ai ? parseFloat(ai.probability) : null;
                return (
                  <div key={tw._id}
                    onClick={() => { setSelected(tw); }}
                    style={{
                      padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #0f172a",
                      background: isSel ? "rgba(14,165,233,0.08)" : "transparent",
                      borderRight: isSel ? `3px solid ${s.color}` : "3px solid transparent",
                      transition: "all 0.15s",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0, boxShadow: `0 0 6px ${s.color}` }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: isSel ? "#e2e8f0" : "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tw.TowerName || tw.name}
                      </span>
                      {prob != null && (
                        <span style={{ fontSize: 9, fontFamily: "monospace", color: prob >= 50 ? "#f87171" : "#34d399" }}>
                          {prob.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, paddingRight: 16 }}>
                      <span style={{ fontSize: 9, color: "#334155", fontFamily: "monospace" }}>{tw.ip_address}</span>
                      <span style={{ fontSize: 9, color: s.color, fontFamily: "monospace" }}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Panel toggle (when hidden) */}
        {!showPanel && (
          <button onClick={() => setShowPanel(true)}
            style={{
              position: "absolute", top: 72, right: 12, zIndex: 1000,
              background: "rgba(10,22,40,0.95)", border: "1px solid #1e293b",
              borderRadius: 10, padding: "8px 12px", cursor: "pointer",
              color: "#38bdf8", fontSize: 11, fontFamily: "monospace",
              backdropFilter: "blur(12px)",
            }}>
            ◧ الأبراج
          </button>
        )}

        {/* ── Map ── */}
        <MapContainer
          center={[26.8, 30.8]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          ref={setMapRef}
          zoomControl={false}
        >
          <TileLayer
            key={tileKey}
            url={TILE_LAYERS[tileKey].url}
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {visible.map(tower => (
            <Marker
              key={tower._id}
              position={[tower.location.lat, tower.location.lng]}
              icon={getIcon(tower)}
              eventHandlers={{ click: () => setSelected(tower) }}
            >
              <Popup>
                <PopupCard tower={tower} aiResult={towerAiResults?.[tower._id]} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* ── Legend ── */}
        <MapLegend counts={counts} />

        {/* ── Stats ribbon (bottom center) ── */}
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 999, display: "flex", gap: 1, overflow: "hidden",
          background: "rgba(10,22,40,0.95)", border: "1px solid #1e293b",
          borderRadius: 12, backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}>
          {[
            { label: "إجمالي",   value: towers.length, color: "#38bdf8" },
            { label: "🟢 طبيعي",  value: counts.normal,   color: "#10b981" },
            { label: "🟡 تحذير",  value: counts.warning,  color: "#f59e0b" },
            { label: "🔴 حرج",    value: counts.critical, color: "#ef4444" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "8px 16px", textAlign: "center", borderRight: i < 3 ? "1px solid #1e293b" : "none" }}>
              <p style={{ margin: 0, fontSize: 9, color: "#334155", fontFamily: "monospace", letterSpacing: 1 }}>{s.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "monospace" }}>{s.value}</p>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}