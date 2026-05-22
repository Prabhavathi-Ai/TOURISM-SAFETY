import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, CircleMarker, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import { Incident, POI, USER_LOCATION, Zone, ZONE_COLOR } from "@/data/safety";

// Fix default marker icons for Leaflet inside bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Approximate India bounding box — used as the default world view
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 68.0],   // SW (Kanyakumari / Gujarat coast)
  [35.7, 97.5],  // NE (Ladakh / Arunachal)
];

function FitBounds({ zones, center }: { zones: Zone[]; center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!zones.length) {
      // No zones loaded yet — show all of India so users can pan/search anywhere
      map.fitBounds(INDIA_BOUNDS, { padding: [20, 20] });
      return;
    }
    const bounds = L.latLngBounds(zones.map((z) => z.center));
    bounds.extend(center);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, zones.length, center[0], center[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function FollowUser({ pos, follow }: { pos: [number, number]; follow: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (follow) map.panTo(pos, { animate: true, duration: 0.6 });
  }, [pos[0], pos[1], follow]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function FlyToSearch({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15, { animate: true, duration: 0.8 });
  }, [pos?.[0], pos?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function makeSearchIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="marker-pulse marker-pulse-search"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export interface RouteSegment {
  positions: [number, number][];
  tone: "safe" | "warn" | "danger";
}

interface Props {
  zones?: Zone[];
  pois?: POI[];
  incidents?: Incident[];
  height?: string;
  interactive?: boolean;
  showUser?: boolean;
  liveUser?: [number, number]; // overrides USER_LOCATION when provided
  follow?: boolean;
  routes?: RouteSegment[];
  /** Recency-weighted heatmap halos around incidents + danger zones. */
  heatmap?: boolean;
  searchResult?: { position: [number, number]; label: string } | null;
}

const TONE_STROKE = {
  safe: "hsl(152 65% 35%)",
  warn: "hsl(38 95% 45%)",
  danger: "hsl(0 78% 48%)",
};

// Pulsing div icon for live incident markers
function makePulseIcon(tone: "danger" | "warn") {
  return L.divIcon({
    className: "",
    html: `<div class="marker-pulse marker-pulse-${tone}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function SafetyMap({
  zones = [],
  pois = [],
  incidents = [],
  height = "100%",
  interactive = true,
  showUser = true,
  liveUser,
  follow = false,
  routes = [],
  heatmap = false,
  searchResult = null,
}: Props) {
  const center: [number, number] = liveUser ?? USER_LOCATION;

  // Recency-weighted incident pressure points (combine incidents + danger zones)
  const heatPoints = useMemo(() => {
    const now = Date.now();
    const pts: { center: [number, number]; intensity: number; radius: number; tone: "warn" | "danger" }[] = [];
    incidents.forEach((i) => {
      const age = i.reportedAt ? (now - i.reportedAt) / 3_600_000 : 12;
      const recency = Math.max(0.1, 1 - age / 48);
      pts.push({
        center: i.position,
        intensity: recency * (i.severity === "danger" ? 1 : 0.6),
        radius: 220 + recency * 220,
        tone: i.severity === "danger" ? "danger" : "warn",
      });
    });
    if (heatmap) {
      zones.filter((z) => z.type !== "safe").forEach((z) => {
        pts.push({
          center: z.center,
          intensity: z.type === "danger" ? 0.7 : 0.4,
          radius: z.radius * 1.3,
          tone: z.type === "danger" ? "danger" : "warn",
        });
      });
    }
    return pts;
  }, [incidents, zones, heatmap]);

  return (
    <div style={{ height }} className="overflow-hidden">
      <MapContainer
        center={center}
        zoom={14}
        minZoom={4}
        maxZoom={19}
        worldCopyJump
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Recency-weighted heatmap halos — layered translucent circles */}
        {heatmap && heatPoints.flatMap((h, idx) => [
          <Circle
            key={`heat-${idx}-outer`}
            center={h.center}
            radius={h.radius * 1.6}
            pathOptions={{
              color: "transparent",
              fillColor: h.tone === "danger" ? "hsl(0 78% 55%)" : "hsl(38 95% 52%)",
              fillOpacity: 0.06 * h.intensity,
              weight: 0,
            }}
            interactive={false}
          />,
          <Circle
            key={`heat-${idx}-inner`}
            center={h.center}
            radius={h.radius}
            pathOptions={{
              color: "transparent",
              fillColor: h.tone === "danger" ? "hsl(0 78% 55%)" : "hsl(38 95% 52%)",
              fillOpacity: 0.14 * h.intensity,
              weight: 0,
            }}
            interactive={false}
          />,
        ])}

        {zones.map((z) => {
          const c = ZONE_COLOR[z.type];
          return (
            <Circle
              key={z.id}
              center={z.center}
              radius={z.radius}
              pathOptions={{ color: c.stroke, fillColor: c.stroke, fillOpacity: 0.18, weight: 1.5 }}
            >
              <Popup>
                <strong>{z.name}</strong>
                <br />
                <span style={{ color: c.stroke }}>{c.label}</span> — {z.reason}
              </Popup>
            </Circle>
          );
        })}

        {/* Routes */}
        {routes.map((r, i) => (
          <Polyline
            key={`route-${i}`}
            positions={r.positions}
            pathOptions={{
              color: TONE_STROKE[r.tone],
              weight: r.tone === "danger" ? 6 : 5,
              opacity: 0.9,
              dashArray: r.tone === "danger" ? "10 6" : undefined,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ))}

        {/* Live pulsing incident markers */}
        {incidents.map((i) => {
          const tone = i.severity === "danger" ? "danger" : "warn";
          return (
            <Marker key={i.id} position={i.position} icon={makePulseIcon(tone)}>
              <Popup>
                <strong>{i.type}</strong>
                <br />
                {i.description}
                <br />
                <em>{i.timeAgo} · {i.reporter}</em>
              </Popup>
            </Marker>
          );
        })}

        {pois.map((p) => (
          <Marker key={p.id} position={p.position}>
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {p.kind}
            </Popup>
          </Marker>
        ))}

        {showUser && (
          <>
            <CircleMarker
              center={center}
              radius={18}
              pathOptions={{ color: "transparent", fillColor: "hsl(184 72% 45%)", fillOpacity: 0.18, weight: 0 }}
              interactive={false}
            />
            <CircleMarker
              center={center}
              radius={10}
              pathOptions={{
                color: "hsl(188 78% 28%)",
                fillColor: "hsl(184 72% 45%)",
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Popup>You are here · live</Popup>
            </CircleMarker>
          </>
        )}

        {searchResult && (
          <Marker position={searchResult.position} icon={makeSearchIcon()}>
            <Popup>
              <strong>{searchResult.label}</strong>
            </Popup>
          </Marker>
        )}

        <FitBounds zones={zones} center={center} />
        {liveUser && <FollowUser pos={center} follow={follow} />}
        <FlyToSearch pos={searchResult ? searchResult.position : null} />
      </MapContainer>
    </div>
  );
}
