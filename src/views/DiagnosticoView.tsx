import { MapPin, Target, Activity, Droplet, TreePine, CloudRain, Navigation, Leaf, ExternalLink, Layers, CheckCircle2 } from 'lucide-react';
import L, { type PathOptions } from 'leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { GeoJSON as GeoJSONLayer, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { ViewState } from '../types';
import { useEffect, useMemo, useState } from 'react';
import { api, apiOptions, ApiRecord } from '../services/api';
import 'leaflet/dist/leaflet.css';

type ZoneFeature = Feature<Geometry, Record<string, unknown>>;
type BaseMap = { id: string; nombre: string; url: string; atribucion: string };
type Objective = { id: string; label: string; description: string; tipo: string; icon: typeof Droplet };

const defaultBaseMaps: BaseMap[] = [
  { id: 'osm', nombre: 'Callejero', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', atribucion: '&copy; OpenStreetMap contributors' },
  { id: 'topografica', nombre: 'Topográfica', url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png', atribucion: '&copy; OpenTopoMap contributors' },
  { id: 'satelital', nombre: 'Satélite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', atribucion: 'Tiles &copy; Esri' },
];

const objectives: Objective[] = [
  { id: 'hidrica', label: 'Protección hídrica', description: 'Resalta las franjas riparias existentes.', tipo: 'franja_riparia', icon: Droplet },
  { id: 'corredor', label: 'Corredores biológicos', description: 'Resalta las zonas de conectividad registradas.', tipo: 'corredor_biologico', icon: TreePine },
  { id: 'erosion', label: 'Control de erosión', description: 'Resalta las zonas de siembra prioritaria.', tipo: 'siembra_prioritaria', icon: Target },
];

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeTitle(value: unknown): string {
  return String(value ?? '')
    .replace(/^\s*#{1,6}\s*/, '')
    .replace(/^cuenca hidrogr[aá]fica\s*/i, '')
    .trim();
}

function readZoneFeatures(value: unknown): ZoneFeature[] {
  if (!isRecord(value)) return [];
  const candidates = Array.isArray(value.features) ? value.features : value.type === 'Feature' ? [value] : [];
  return candidates.filter((feature): feature is ZoneFeature => {
    if (!isRecord(feature) || feature.type !== 'Feature' || !isRecord(feature.geometry)) return false;
    const type = feature.geometry.type;
    const hasCoordinates = type === 'GeometryCollection' ? Array.isArray(feature.geometry.geometries) : Array.isArray(feature.geometry.coordinates);
    return typeof type === 'string' && hasCoordinates
      && ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'].includes(type)
      && (feature.properties === null || isRecord(feature.properties));
  });
}

function readBaseMaps(value: unknown): BaseMap[] {
  const fallbackById = new Map(defaultBaseMaps.map((layer) => [layer.id, layer]));
  const layers = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.capas) ? value.capas : [];
  const parsed = layers.flatMap((layer): BaseMap[] => {
    if (!isRecord(layer)) return [];
    const id = String(layer.id ?? '').toLowerCase();
    const fallback = fallbackById.get(id);
    const url = typeof layer.url === 'string' ? layer.url : '';
    if (!fallback || !/^https?:\/\//i.test(url) || url.includes('{INSTANCE_ID}')) return [];
    return [{
      ...fallback,
      nombre: typeof layer.nombre === 'string' && layer.nombre.trim() ? layer.nombre.trim() : fallback.nombre,
      url,
      atribucion: typeof layer.atribucion === 'string' && layer.atribucion.trim() ? layer.atribucion : fallback.atribucion,
    }];
  });
  return parsed.length ? parsed : [defaultBaseMaps[0]];
}

function zoneStyle(feature?: Feature<Geometry, Record<string, unknown>>): PathOptions {
  const type = String(feature?.properties?.tipo ?? '');
  const colors: Record<string, string> = {
    franja_riparia: '#0284c7',
    corredor_biologico: '#7c3aed',
    siembra_prioritaria: '#15803d',
  };
  const color = colors[type] ?? '#d97706';
  return { color, weight: 3, fillColor: color, fillOpacity: 0.3 };
}

function zoneBounds(features: ZoneFeature[]): L.LatLngBounds | null {
  const coordinates: L.LatLngExpression[] = [];
  const collect = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      if (Number.isFinite(value[0]) && Number.isFinite(value[1])) coordinates.push([value[1], value[0]]);
      return;
    }
    value.forEach(collect);
  };
  const visitGeometry = (geometry: Geometry) => {
    if (geometry.type === 'GeometryCollection') geometry.geometries.forEach(visitGeometry);
    else collect(geometry.coordinates);
  };
  features.forEach((feature) => visitGeometry(feature.geometry));
  return coordinates.length ? L.latLngBounds(coordinates) : null;
}

function MapViewport({ features, locateRequest }: { features: ZoneFeature[]; locateRequest: number }) {
  const map = useMap();
  useEffect(() => {
    const bounds = zoneBounds(features);
    if (bounds?.isValid()) map.fitBounds(bounds.pad(0.18), { maxZoom: 16 });
  }, [features, locateRequest, map]);
  return null;
}

function ZoneMap({ allFeatures, visibleFeatures, baseMap, locateRequest }: {
  allFeatures: ZoneFeature[];
  visibleFeatures: ZoneFeature[];
  baseMap: BaseMap;
  locateRequest: number;
}) {
  const visibleData = useMemo<FeatureCollection<Geometry, Record<string, unknown>>>(() => ({ type: 'FeatureCollection', features: visibleFeatures }), [visibleFeatures]);
  return (
    <MapContainer center={[0, 0]} zoom={2} scrollWheelZoom className="h-full w-full">
      <TileLayer attribution={baseMap.atribucion} url={baseMap.url} />
      {visibleFeatures.length > 0 && <GeoJSONLayer
        key={`${baseMap.id}-${visibleFeatures.map((feature) => String(feature.id ?? feature.properties?.tipo ?? '')).join('|')}`}
        data={visibleData}
        style={zoneStyle}
        onEachFeature={(feature, layer) => {
          const label = String(feature.properties?.etiqueta ?? feature.properties?.nombre ?? feature.properties?.tipo ?? 'Zona del predio');
          const content = L.DomUtil.create('span');
          content.textContent = label.replace(/^\s*#{1,6}\s*/, '');
          layer.bindPopup(content);
        }}
      />}
      <MapViewport features={allFeatures} locateRequest={locateRequest} />
    </MapContainer>
  );
}

export default function DiagnosticoView({ setCurrentView }: { setCurrentView: (v: ViewState) => void }) {
  const [diagnosis, setDiagnosis] = useState<ApiRecord | null>(null);
  const [basin, setBasin] = useState<ApiRecord | null>(null);
  const [zoneFeatures, setZoneFeatures] = useState<ZoneFeature[]>([]);
  const [baseMaps, setBaseMaps] = useState(defaultBaseMaps);
  const [activeBaseMap, setActiveBaseMap] = useState(defaultBaseMaps[0].id);
  const [activeObjective, setActiveObjective] = useState('');
  const [locateRequest, setLocateRequest] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [diagnosisLoading, setDiagnosisLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const results = await Promise.allSettled([
        api.getDiagnosticoVigente(apiOptions.loteId),
        api.listCuencas(),
        api.getCapasMapa(),
        api.getZonasMapa(apiOptions.loteId),
      ]);
      if (!active) return;
      const errors = results.flatMap((result) => result.status === 'rejected' ? [result.reason instanceof Error ? result.reason.message : 'Error al cargar datos de la API.'] : []);
      if (results[0].status === 'fulfilled') setDiagnosis(results[0].value);
      if (results[1].status === 'fulfilled') setBasin(Array.isArray(results[1].value) ? results[1].value[0] ?? null : null);
      if (results[2].status === 'fulfilled') setBaseMaps(readBaseMaps(results[2].value));
      if (results[3].status === 'fulfilled') {
        setZoneFeatures(readZoneFeatures(results[3].value));
      }
      if (errors.length) setLoadError(errors.join(' '));
      setDiagnosisLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const visibleFeatures = useMemo(() => {
    if (!activeObjective) return zoneFeatures;
    const targetType = objectives.find((item) => item.id === activeObjective)?.tipo;
    return zoneFeatures.filter((feature) => feature.properties?.tipo === targetType);
  }, [activeObjective, zoneFeatures]);
  const selectedBaseMap = baseMaps.find((layer) => layer.id === activeBaseMap) ?? baseMaps[0];
  const mapCenter = useMemo(() => zoneBounds(zoneFeatures)?.getCenter() ?? null, [zoneFeatures]);
  const basinName = normalizeTitle(basin?.nombre);
  const precipitation = diagnosis?.precipitacion_anual_mm;
  const coverageLoss = diagnosis?.perdida_cobertura_pct;
  const riparianWidth = diagnosis?.franja_riparia_legal_m;
  const rainfallRegime = String((diagnosis?.regimen as ApiRecord | undefined)?.nombre ?? '—');
  const risk = String(diagnosis?.riesgo_acarreo ?? '—').replaceAll('_', ' ');
  const connectivity = String(diagnosis?.conectividad_fauna ?? '—').replaceAll('_', ' ');
  const months = Array.isArray(diagnosis?.precipitacion_mensual)
    ? diagnosis.precipitacion_mensual.map((item) => Number(typeof item === 'number' ? item : (item as ApiRecord).precipitacion_mm ?? 0))
    : [];
  const plantingWindow = Array.isArray(diagnosis?.ventanas_siembra)
    ? String((diagnosis.ventanas_siembra[0] as ApiRecord | undefined)?.nota ?? '—')
    : '—';
  const suggestedSpecies = Number(diagnosis?.total_especies_sugeridas ?? 0);
  const compatibility = diagnosis?.compatibilidad_promedio_pct;

  useEffect(() => {
    if (baseMaps.some((layer) => layer.id === activeBaseMap)) return;
    setActiveBaseMap(baseMaps[0].id);
  }, [activeBaseMap, baseMaps]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {loadError && <p role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{loadError}</p>}
      {!diagnosis && <p role={diagnosisLoading ? 'status' : 'alert'} className={`rounded-xl p-4 text-sm ${diagnosisLoading ? 'bg-surface-container-low text-on-surface-variant' : 'bg-error/10 text-error'}`}>
        {diagnosisLoading ? 'Cargando diagnóstico del predio…' : 'No se encontró un diagnóstico para este lote. Puedes consultar las geometrías disponibles en el mapa.'}
      </p>}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Top Panel */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Módulo 01 · Bio-Diagnóstico</span>
                <h2 className="font-epilogue text-xl font-bold text-primary">Parámetros del Predio</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-xl border border-surface-container">
              <MapPin className="text-primary-container w-5 h-5 ml-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">Predio seleccionado</span>
                <span className="block truncate text-xs font-semibold text-on-surface">{apiOptions.loteId}</span>
              </div>
              <button
                type="button"
                onClick={() => setLocateRequest((request) => request + 1)}
                disabled={!zoneFeatures.length}
                className="bg-primary hover:bg-primary-container text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enfocar mapa
              </button>
              {mapCenter && <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapCenter.lat},${mapCenter.lng}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir ubicación aproximada en Google Maps"
                title="Abrir ubicación aproximada en Google Maps"
                className="rounded-lg p-2 text-primary hover:bg-surface-container"
              >
                <ExternalLink className="h-4 w-4" />
              </a>}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Objetivo de Reforestación Prioritario:</span>
              <div className="flex flex-wrap gap-2">
                {objectives.map(({ id, label, description, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={activeObjective === id}
                    title={description}
                    onClick={() => setActiveObjective((current) => current === id ? '' : id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1 shadow-sm transition-colors ${activeObjective === id ? 'bg-primary text-white' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
                  >
                    <Icon className="w-3 h-3" />{label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-on-surface-variant">Selecciona un enfoque para filtrar las zonas del mapa. La API aún no ofrece un campo para guardar este objetivo.</p>
            </div>
          </div>

          {/* Edaphic Matrix */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
              <span className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Datos del diagnóstico</span>
                <h3 className="font-epilogue text-lg font-bold text-primary">Matriz Edáfica & Bioclimática</h3>
              </div>
              <span className="text-xs font-semibold bg-surface-container px-2 py-1 rounded-md text-secondary flex items-center gap-1">
              <Activity className="w-3 h-3"/> {diagnosis?.muestra_suelo_id ? 'Muestra vinculada' : 'Sin muestra de suelo'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container">
                <div className="text-xs text-on-surface-variant font-semibold flex items-center justify-between">
                  Suelo & Acidez
                  <Target className="w-3 h-3 text-secondary" />
                </div>
                <div className="text-2xl font-epilogue font-bold text-primary mt-1 leading-none">pH —</div>
                <div className="text-xs font-semibold text-secondary mt-1">La API no incluye el pH de la muestra</div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container">
                <div className="text-xs text-on-surface-variant font-semibold flex items-center justify-between">
                  Pérdida Cobertura
                  <Leaf className="w-3 h-3 text-error" />
                </div>
                <div className="text-2xl font-epilogue font-bold text-error mt-1 leading-none">{coverageLoss === undefined ? '—' : `-${coverageLoss}%`}</div>
                <div className="text-xs font-semibold text-on-surface-variant mt-1">Pérdida registrada</div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-error rounded-full" style={{ width: `${Math.min(100, Math.max(0, Number(coverageLoss ?? 0)))}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-sm font-semibold text-on-surface">
                <CloudRain className="w-4 h-4 text-secondary"/> Precipitación: {precipitation === undefined ? '—' : `${Number(precipitation).toLocaleString('es-CO')} mm/año`}
                </div>
                <span className="text-[10px] font-bold bg-surface-container-lowest px-2 py-0.5 rounded-full text-secondary shadow-sm">{rainfallRegime}</span>
              </div>
              {months.length > 0 ? <>
                <div className="h-16 flex items-end justify-between gap-1 mt-2" aria-label="Precipitación mensual">
                  {months.map((value, i) => {
                    const height = Math.max(4, Math.round(value / Math.max(...months, 1) * 100));
                    return <div key={i} title={`${value} mm`} className="w-full rounded-t-sm bg-secondary" style={{ height: `${height}%` }} />;
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-on-surface-variant mt-1">
                  <span>Ene</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
                </div>
              </> : <p className="py-4 text-xs text-on-surface-variant">No hay serie de precipitación mensual para este diagnóstico.</p>}
              <div className="mt-3 bg-surface-container-highest p-3 rounded-lg flex items-center justify-between border border-surface-container">
                <div>
                  <div className="text-xs font-bold text-tertiary-container">Ventana Óptima de Siembra</div>
                  <div className="text-[10px] text-on-surface font-semibold mt-0.5">{plantingWindow}</div>
                </div>
                <CheckCircle2 className="text-secondary w-5 h-5"/>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="font-epilogue text-xl font-bold text-primary flex items-center gap-2">
                  <Layers className="h-5 w-5 text-secondary" />
                  {basinName || 'Mapa del predio'}
                </h3>
                <span className="text-xs text-on-surface-variant font-semibold">
                  {basin?.elevacion_msnm !== undefined ? `Elevación de cuenca: ${String(basin.elevacion_msnm)} msnm · ` : ''}
                  {zoneFeatures.length} {zoneFeatures.length === 1 ? 'zona' : 'zonas'} con geometría
                </span>
              </div>
              <div className="flex flex-wrap gap-1 rounded-lg bg-surface-container-low p-1" aria-label="Mapa base">
                {baseMaps.map((layer) => <button
                  key={layer.id}
                  type="button"
                  aria-pressed={activeBaseMap === layer.id}
                  onClick={() => setActiveBaseMap(layer.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${activeBaseMap === layer.id ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >{layer.nombre}</button>)}
              </div>
            </div>

            <div className="relative h-[360px] w-full overflow-hidden rounded-xl border border-surface-container-high bg-slate-100 shadow-inner md:h-[420px]">
              <ZoneMap allFeatures={zoneFeatures} visibleFeatures={visibleFeatures} baseMap={selectedBaseMap} locateRequest={locateRequest} />
              {visibleFeatures.length === 0 && (
                <div className="absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-lg bg-white/95 px-3 py-2 text-center text-xs text-on-surface shadow">
                  {zoneFeatures.length === 0
                    ? 'La API no devolvió geometrías para este predio.'
                    : 'No hay zonas registradas para este objetivo.'}
                </div>
              )}
              {zoneFeatures.length > 0 && (
                <div className="absolute bottom-4 left-4 z-[500] rounded-xl border border-surface-container bg-white/95 p-3 text-xs font-semibold shadow-md backdrop-blur">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant"><Layers className="h-3.5 w-3.5" /> Zonas del predio</div>
                  {[
                    ['siembra_prioritaria', 'Zona prioritaria', '#15803d'],
                    ['franja_riparia', 'Franja riparia', '#0284c7'],
                    ['corredor_biologico', 'Corredor biológico', '#7c3aed'],
                  ].filter(([type]) => zoneFeatures.some((feature) => feature.properties?.tipo === type)).map(([type, label, color]) => (
                    <div key={type} className="mb-1 flex items-center gap-2 last:mb-0"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />{label}</div>
                  ))}
                </div>
              )}
              <div className="absolute right-3 top-3 z-[500] flex gap-2">
                <button
                  type="button"
                  disabled={!zoneFeatures.some((feature) => feature.properties?.tipo === 'franja_riparia')}
                  aria-pressed={activeObjective === 'hidrica'}
                  onClick={() => setActiveObjective((current) => current === 'hidrica' ? '' : 'hidrica')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold shadow transition disabled:cursor-not-allowed disabled:opacity-50 ${activeObjective === 'hidrica' ? 'bg-sky-700 text-white' : 'bg-white/95 text-sky-800 hover:bg-white'}`}
                >Hídrica</button>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant">Puedes desplazarte, acercar y seleccionar las geometrías para ver su nombre. El backend entrega zonas; no expone el perímetro catastral del lote ni una capa de dosel NDVI.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-surface-container-lowest rounded-lg shadow-sm"><Navigation className="w-5 h-5 text-secondary"/></div>
                <div>
                  <div className="text-xs text-on-surface-variant font-semibold">Franja Riparia Legal</div>
                  <div className="text-sm font-bold text-primary">{riparianWidth === undefined ? 'Sin dato' : `${riparianWidth} m requeridos`}</div>
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-surface-container-lowest rounded-lg shadow-sm"><CloudRain className="w-5 h-5 text-tertiary-container"/></div>
                <div>
                  <div className="text-xs text-on-surface-variant font-semibold">Riesgo de Acarreo</div>
                  <div className="text-sm font-bold text-primary capitalize">{risk}</div>
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-surface-container-lowest rounded-lg shadow-sm"><TreePine className="w-5 h-5 text-primary"/></div>
                <div>
                  <div className="text-xs text-on-surface-variant font-semibold">Conectividad Fauna</div>
                  <div className="text-sm font-bold text-primary capitalize">{connectivity}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA Card */}
          <div className="bg-primary-container rounded-2xl p-6 md:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <TreePine className="absolute -right-8 -bottom-12 w-48 h-48 text-white/5 pointer-events-none" />
            <div className="flex flex-col gap-2 z-10 text-white w-full max-w-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-white px-2.5 py-0.5 rounded-full shadow-sm">Resultado del Diagnóstico</span>
              {compatibility !== undefined && <span className="text-xs text-on-primary-container font-semibold">Compatibilidad ecológica: {compatibility}%</span>}
            </div>
            <h3 className="font-epilogue text-2xl md:text-3xl font-bold leading-tight">{suggestedSpecies > 0 ? `${suggestedSpecies} especies nativas sugeridas` : 'Catálogo de especies'}</h3>
            <p className="text-sm text-on-primary-container mt-1">Consulta las especies recomendadas para el diagnóstico vigente y revisa sus características antes de agregarlas al proyecto.</p>
            </div>
            <button 
              onClick={() => setCurrentView('catalogo')}
              className="w-full md:w-auto bg-surface-container-lowest text-primary hover:bg-surface text-sm font-bold px-6 py-3 rounded-full transition-colors flex items-center justify-center gap-2 whitespace-nowrap z-10 shadow-sm active:scale-95"
            >
              <Leaf className="w-5 h-5 text-secondary"/> Ver Catálogo de Especies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
