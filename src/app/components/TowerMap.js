//TowerMap
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// حل مشكلة أيقونة Leaflet في Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function TowerMap({ towers = [] }) {
  // لون النقطة حسب الحالة
  const getMarkerIcon = (status) => {
    let color;
    switch (status) {
      case "normal":
        color = "#10b981"; // أخضر
        break;
      case "warning":
        color = "#f59e0b"; // أصفر
        break;
      case "critical":
        color = "#ef4444"; // أحمر
        break;
      default:
        color = "#6b7280"; // رمادي
    }

    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        border: 4px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        transform: rotate(-45deg);
      "></div>
      <div style="
        position: absolute;
        top: 28px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        width: 10px;
        height: 10px;
        background: ${color};
        clip-path: polygon(0 0, 100% 0, 50% 100%);
      "></div>`,
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -40],
    });
  };

  return (
    <MapContainer
      center={[30.0, 31.2]} // وسط مصر
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      className="leaflet-map-container"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
      />

      {towers.map((tower) => (
        <Marker
          key={tower._id}
          position={[tower.location.lat, tower.location.lng]}
          icon={getMarkerIcon(tower.status)}
        >
          <Popup>
            <div className="text-center p-2">
              <h3 className="font-bold text-lg mb-2">{tower.name}</h3>
              <p className="text-sm mb-1">
                <strong>الحالة:</strong>{" "}
                <span
                  className={`font-medium ${
                    tower.status === "normal"
                      ? "text-green-600"
                      : tower.status === "warning"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {tower.status === "normal"
                    ? "طبيعي"
                    : tower.status === "warning"
                    ? "تحذير"
                    : "عطل خطير"}
                </span>
              </p>
              <p className="text-sm mb-1">
                <strong>RSRP:</strong>{" "}
                {tower.lastMeasurement?.rsrp?.toFixed(1) || "غير متوفر"} dBm
              </p>
              <p className="text-sm mb-1">
                <strong>درجة الحرارة:</strong>{" "}
                {tower.lastMeasurement?.temperature?.toFixed(1) || "غير متوفر"}
                °C
              </p>
              <p className="text-sm mb-1">
                <strong>CPU:</strong>{" "}
                {tower.lastMeasurement?.cpu?.toFixed(0) || "غير متوفر"}%
              </p>
              <p className="text-sm">
                <strong>الشركة:</strong> {tower.vendor}
              </p>
              <p className="text-xs text-gray-500 mt-3">
                آخر تحديث:{" "}
                {tower.updatedAt
                  ? new Date(tower.updatedAt).toLocaleTimeString("ar-EG")
                  : "غير معروف"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
