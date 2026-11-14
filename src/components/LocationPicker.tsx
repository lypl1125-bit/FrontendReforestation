import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { CircleMarker, MapContainer, Polygon, Polyline, TileLayer, useMapEvents } from 'react-leaflet';
import { Map, MapPin, RotateCcw, Trash2 } from 'lucide-react';
import type { GpsCoordinate } from '../services/api';

type Props = {
  predioLocation: GpsCoordinate | null;
  onPredioLocationChange: (location: GpsCoordinate | null) => void;
  lotBoundary: GpsCoordinate[];
  onLotBoundaryChange: Dispatch<SetStateAction<GpsCoordinate[]>>;
  allowPredioLocation: boolean;
};

type SelectionMode = 'predio' | 'lote';

function MapClickHandler({ mode, allowPredioLocation, onPredioLocationChange, onLotBoundaryChange }: {
  mode: SelectionMode;
  allowPredioLocation: boolean;
  onPredioLocationChange: Props['onPredioLocationChange'];
  onLotBoundaryChange: Props['onLotBoundaryChange'];
}) {
  useMapEvents({
    click(event) {
      const location = { lat: event.latlng.lat, lng: event.latlng.lng };
      if (mode === 'predio' && allowPredioLocation) {
        onPredioLocationChange(location);
      } else {
        onLotBoundaryChange((points) => [...points, location]);
      }
    },
  });
  return null;
}

export default function LocationPicker({
  predioLocation,
  onPredioLocationChange,
  lotBoundary,
  onLotBoundaryChange,
  allowPredioLocation,
}: Props) {
  const [mode, setMode] = useState<SelectionMode>(allowPredioLocation ? 'predio' : 'lote');

  useEffect(() => {
    if (!allowPredioLocation) setMode('lote');
  }, [allowPredioLocation]);

  const instructions = mode === 'predio'
    ? 'Haz clic en el mapa para marcar el punto de referencia del predio.'
    : 'Haz clic en el mapa para dibujar el perímetro del lote. Marca al menos tres vértices.';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {allowPredioLocation && <button
          type="button"
          aria-pressed={mode === 'predio'}
          onClick={() => setMode('predio')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${mode === 'predio' ? 'bg-primary-container text-white' : 'border border-outline-variant text-on-surface-variant'}`}
        ><MapPin size={15} /> Ubicación del predio</button>}
        <button
          type="button"
          aria-pressed={mode === 'lote'}
          onClick={() => setMode('lote')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${mode === 'lote' ? 'bg-primary-container text-white' : 'border border-outline-variant text-on-surface-variant'}`}
        ><Map size={15} /> Perímetro del lote</button>
        <button
          type="button"
          onClick={() => onLotBoundaryChange(lotBoundary.slice(0, -1))}
          disabled={lotBoundary.length === 0}
          className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface-variant disabled:opacity-40"
        ><RotateCcw size={14} /> Deshacer vértice</button>
        <button
          type="button"
          onClick={() => onLotBoundaryChange([])}
          disabled={lotBoundary.length === 0}
          className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface-variant disabled:opacity-40"
        ><Trash2 size={14} /> Borrar perímetro</button>
      </div>
      <p className="text-xs leading-5 text-on-surface-variant" role="status">{instructions}</p>
      <div className="h-[320px] overflow-hidden rounded-xl border border-outline-variant sm:h-[390px]">
        <MapContainer center={[4.5, -74]} zoom={6} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler
            mode={mode}
            allowPredioLocation={allowPredioLocation}
            onPredioLocationChange={onPredioLocationChange}
            onLotBoundaryChange={onLotBoundaryChange}
          />
          {allowPredioLocation && predioLocation && <CircleMarker
            center={[predioLocation.lat, predioLocation.lng]}
            radius={8}
            pathOptions={{ color: '#064e3b', fillColor: '#10b981', fillOpacity: 0.9, weight: 2 }}
          />}
          {lotBoundary.length >= 3
            ? <Polygon positions={lotBoundary.map(({ lat, lng }) => [lat, lng])} pathOptions={{ color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.18, weight: 3 }} />
            : lotBoundary.length > 0
              ? <Polyline positions={lotBoundary.map(({ lat, lng }) => [lat, lng])} pathOptions={{ color: '#15803d', weight: 3, dashArray: '6 6' }} />
              : null}
          {lotBoundary.map(({ lat, lng }, index) => <CircleMarker
            key={`${lat}-${lng}-${index}`}
            center={[lat, lng]}
            radius={4}
            pathOptions={{ color: '#ffffff', fillColor: '#15803d', fillOpacity: 1, weight: 2 }}
          />)}
        </MapContainer>
      </div>
      <div className="grid gap-2 text-xs text-on-surface-variant sm:grid-cols-2">
        {allowPredioLocation && <p>Coordenadas del predio: {predioLocation ? `${predioLocation.lat.toFixed(6)}, ${predioLocation.lng.toFixed(6)}` : 'sin marcar'}</p>}
        <p>Vértices del lote: {lotBoundary.length} {lotBoundary.length < 3 ? '(faltan al menos 3)' : '(perímetro listo)'}</p>
      </div>
    </div>
  );
}
