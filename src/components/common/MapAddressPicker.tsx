import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Search, X, Check, Loader2 } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MapPickedAddress {
  addressLine1: string;
  city:         string;
  state:        string;
  pincode:      string;
  country:      string;
  lat?:         number;
  lng?:         number;
}

interface MapAddressPickerProps {
  onConfirm: (address: MapPickedAddress) => void;
  onClose:   () => void;
  initialAddress?: Partial<MapPickedAddress>;
}

// ─── Tile configuration (configurable — change provider here) ─────────────────

const TILE_CONFIG = {
  url:    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

// ─── Custom marker icon (inline SVG — no image file imports needed) ────────────

const markerIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#244C36" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#C5A15A" stroke="#C5A15A"/></svg>`,
  className: 'dtc-map-marker',
  iconSize:    [28, 28],
  iconAnchor:  [14, 28],
});

// ─── Reverse geocoding (Nominatim — rate-limited, cached) ─────────────────────

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';
const reverseGeocodeCache = new Map<string, MapPickedAddress>();
let lastGeocodeTime = 0;
const GEOCODE_MIN_INTERVAL_MS = 1100; // respect 1 req/sec rate limit

async function reverseGeocode(lat: number, lng: number): Promise<MapPickedAddress | null> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = reverseGeocodeCache.get(cacheKey);
  if (cached) return cached;

  // Rate limit
  const now = Date.now();
  const elapsed = now - lastGeocodeTime;
  if (elapsed < GEOCODE_MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, GEOCODE_MIN_INTERVAL_MS - elapsed));
  }
  lastGeocodeTime = Date.now();

  try {
    const url = `${NOMINATIM_REVERSE}?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=in`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.address) return null;

    const a = data.address;
    const address: MapPickedAddress = {
      addressLine1: [a.house_number, a.road, a.neighbourhood].filter(Boolean).join(' ').trim() ||
                    a.suburb || a.village || '',
      city:    a.city || a.town || a.municipality || a.county || '',
      state:   a.state || '',
      pincode: a.postcode || '',
      country: a.country || 'India',
      lat, lng,
    };
    reverseGeocodeCache.set(cacheKey, address);
    return address;
  } catch {
    return null;
  }
}

// ─── Click handler component (child of MapContainer) ──────────────────────────

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

// ─── Fly-to component (updates map center when position changes externally) ────

function FlyTo({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 15), { duration: 0.5 });
  }, [position, map]);
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

const MapAddressPicker = ({ onConfirm, onClose, initialAddress }: MapAddressPickerProps) => {
  const [position, setPosition] = useState<{ lat: number; lng: number }>(() => ({
    lat: initialAddress?.lat ?? 19.076,
    lng: initialAddress?.lng ?? 72.8777,
  }));
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<MapPickedAddress>({
    addressLine1: initialAddress?.addressLine1 ?? '',
    city:         initialAddress?.city         ?? '',
    state:        initialAddress?.state        ?? '',
    pincode:      initialAddress?.pincode      ?? '',
    country:      'India',
    lat:          initialAddress?.lat,
    lng:          initialAddress?.lng,
  });
  const [geocoding, setGeocoding] = useState(false);
  const [mapError, setMapError]   = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Handle map click or marker drag ──────────────────────────────────────────
  const handlePick = useCallback(async (lat: number, lng: number) => {
    setPosition({ lat, lng });
    setSelected((s) => ({ ...s, lat, lng }));
    setGeocoding(true);
    const result = await reverseGeocode(lat, lng);
    setGeocoding(false);
    if (result) {
      setSelected({ ...result, lat, lng });
    }
  }, []);

  const handleUseLocation = () => {
    if (!navigator.geolocation) { setMapError('Geolocation is not supported by your browser.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition({ lat, lng });
        setFlyTarget({ lat, lng });
        handlePick(lat, lng);
      },
      () => setMapError('Location access denied. Please click on the map to select your location.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleConfirm = () => {
    if (!selected.addressLine1 || !selected.city) return;
    onConfirm(selected);
  };

  // ── Search via Nominatim forward geocoding (rate-limited) ─────────────────────
  const handleSearch = async () => {
    const query = searchRef.current?.value.trim();
    if (!query) return;
    setGeocoding(true);
    try {
      const now = Date.now();
      const elapsed = now - lastGeocodeTime;
      if (elapsed < GEOCODE_MIN_INTERVAL_MS) await new Promise((r) => setTimeout(r, GEOCODE_MIN_INTERVAL_MS - elapsed));
      lastGeocodeTime = Date.now();

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&addressdetails=1&limit=1`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) { setGeocoding(false); return; }
      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setPosition({ lat, lng });
          setFlyTarget({ lat, lng });
          handlePick(lat, lng);
        }
      }
    } catch { /* ignore */ }
    setGeocoding(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
         onClick={onClose}>
      <div className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
           onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4D9]">
          <h2 className="text-base font-semibold text-[#292D28]" style={{ fontFamily: 'var(--font-heading)' }}>
            <MapPin size={16} className="inline mr-2 text-[var(--brand-primary)]" />Pick Location on Map
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
            <X size={18} />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 pt-3 pb-2 flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F] pointer-events-none" />
            <input ref={searchRef} type="text" placeholder="Search address…"
                   onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                   className="w-full pl-10 pr-4 py-2.5 border border-[#E8E4D9] rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
          </div>
          <button onClick={handleSearch} title="Search"
                  className="px-3 rounded-xl border border-[#E8E4D9] text-[var(--brand-primary)] hover:bg-[var(--brand-background)] transition-colors text-sm font-semibold">
            {geocoding ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
          </button>
          <button onClick={handleUseLocation} title="Use current location"
                  className="p-2.5 rounded-xl border border-[#E8E4D9] text-[var(--brand-primary)] hover:bg-[var(--brand-background)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
            <Navigation size={18} />
          </button>
        </div>

        {/* Map */}
        <div className="w-full h-64 sm:h-80 bg-[var(--brand-background)] relative">
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={15}
            className="w-full h-full"
            scrollWheelZoom
          >
            <TileLayer
              url={TILE_CONFIG.url}
              attribution={TILE_CONFIG.attribution}
              maxZoom={TILE_CONFIG.maxZoom}
            />
            <Marker
              position={[position.lat, position.lng]}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const ll = m.getLatLng();
                  handlePick(ll.lat, ll.lng);
                },
              }}
            />
            <ClickHandler onClick={handlePick} />
            <FlyTo position={flyTarget} />
          </MapContainer>

          {/* Geocoding overlay */}
          {geocoding && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1.5 rounded-full text-xs text-[#73786F] shadow flex items-center gap-1.5 z-[1000]">
              <Loader2 size={12} className="animate-spin" /> Looking up address…
            </div>
          )}

          {/* Error overlay */}
          {mapError && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full text-xs text-red-700 shadow z-[1000]">
              {mapError}
            </div>
          )}

          {/* Attribution is rendered by Leaflet itself */}
        </div>

        {/* Picked address fields */}
        <div className="px-4 py-3 bg-[var(--brand-background)] border-t border-[#E8E4D9]">
          <p className="text-xs font-semibold text-[#73786F] mb-2 uppercase tracking-wide">
            Confirm address details {geocoding && <span className="text-[var(--brand-primary)] normal-case">· auto-filling…</span>}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Address Line 1" value={selected.addressLine1}
                   onChange={(e) => setSelected((s) => ({ ...s, addressLine1: e.target.value }))}
                   className="col-span-2 w-full rounded-xl border border-[#E8E4D9] px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
            <input placeholder="City" value={selected.city}
                   onChange={(e) => setSelected((s) => ({ ...s, city: e.target.value }))}
                   className="w-full rounded-xl border border-[#E8E4D9] px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
            <input placeholder="State" value={selected.state}
                   onChange={(e) => setSelected((s) => ({ ...s, state: e.target.value }))}
                   className="w-full rounded-xl border border-[#E8E4D9] px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
            <input placeholder="PIN Code" value={selected.pincode}
                   onChange={(e) => setSelected((s) => ({ ...s, pincode: e.target.value }))}
                   className="w-full rounded-xl border border-[#E8E4D9] px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
          </div>
          <p className="text-[10px] text-[#73786F] mt-2">
            Coordinates: {selected.lat?.toFixed(4)}, {selected.lng?.toFixed(4)}
          </p>
        </div>

        {/* Confirm */}
        <div className="px-4 py-3 border-t border-[#E8E4D9] flex gap-3">
          <button onClick={handleConfirm}
                  disabled={!selected.addressLine1 || !selected.city}
                  className="flex-1 flex items-center justify-center gap-2 bg-[var(--brand-primary)] text-white font-semibold text-sm py-3 rounded-xl hover:bg-[var(--brand-dark)] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
            <Check size={15} />Confirm Location
          </button>
          <button onClick={onClose}
                  className="flex-1 border border-[#E8E4D9] text-[#73786F] font-semibold text-sm py-3 rounded-xl hover:bg-[var(--brand-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapAddressPicker;
