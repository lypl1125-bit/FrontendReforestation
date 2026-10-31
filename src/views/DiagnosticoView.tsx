import { MapPin, Target, Activity, Droplet, TreePine, CloudRain, CheckCircle2, Navigation, Leaf } from 'lucide-react';
import { ViewState } from '../types';
import { useEffect, useState } from 'react';
import { api, apiOptions, ApiRecord } from '../services/api';

export default function DiagnosticoView({ setCurrentView }: { setCurrentView: (v: ViewState) => void }) {
  const [diagnosis, setDiagnosis] = useState<ApiRecord | null>(null);
  const [basin, setBasin] = useState<ApiRecord | null>(null);
  const [zonesCount, setZonesCount] = useState(0);
  const [mapLayersCount, setMapLayersCount] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [diagnosisLoading, setDiagnosisLoading] = useState(apiOptions.dataSource === 'api');

  useEffect(() => {
    if (apiOptions.dataSource !== 'api') return;
    let active = true;
    const load = async () => {
      const results = await Promise.allSettled([
        api.getDiagnosticoVigente(apiOptions.loteId),
        api.listCuencas(),
        api.getCapasMapa(),
        api.getZonasMapa(apiOptions.loteId),
        api.getNdvi(apiOptions.loteId),
      ]);
      if (!active) return;
      const errors = results.flatMap((result) => result.status === 'rejected' ? [result.reason instanceof Error ? result.reason.message : 'Error al cargar datos de la API.'] : []);
      if (results[0].status === 'fulfilled') setDiagnosis(results[0].value);
      if (results[1].status === 'fulfilled') setBasin(results[1].value[0] ?? null);
      if (results[2].status === 'fulfilled') setMapLayersCount(results[2].value.length);
      if (results[3].status === 'fulfilled') {
        const features = results[3].value.features;
        setZonesCount(Array.isArray(features) ? features.length : 0);
      }
      if (errors.length) setLoadError(errors.join(' '));
      setDiagnosisLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const precipitation = Number(diagnosis?.precipitacion_anual_mm ?? 1850);
  const coverageLoss = Number(diagnosis?.perdida_cobertura_pct ?? 42);
  const riparianWidth = Number(diagnosis?.franja_riparia_legal_m ?? 30);
  const rainfallRegime = String((diagnosis?.regimen as ApiRecord | undefined)?.nombre ?? 'Bimodal');
  const risk = String(diagnosis?.riesgo_acarreo ?? 'medio_alto').replaceAll('_', ' ');
  const connectivity = String(diagnosis?.conectividad_fauna ?? 'interrumpido').replaceAll('_', ' ');
  const months = Array.isArray(diagnosis?.precipitacion_mensual)
    ? diagnosis.precipitacion_mensual.map((item) => Number((item as ApiRecord).precipitacion_mm ?? 0))
    : [120, 95, 150, 180, 200, 80, 60, 70, 140, 190, 160, 100];
  const plantingWindow = Array.isArray(diagnosis?.ventanas_siembra)
    ? String((diagnosis.ventanas_siembra[0] as ApiRecord | undefined)?.nota ?? 'Octubre - Diciembre')
    : 'Octubre - Diciembre';
  const suggestedSpecies = Number(diagnosis?.total_especies_sugeridas ?? 14);
  const compatibility = Number(diagnosis?.compatibilidad_promedio_pct ?? 94);

  if (apiOptions.dataSource === 'api' && !diagnosis) {
    return <p role={loadError ? 'alert' : 'status'} className={`rounded-xl p-4 text-sm ${loadError ? 'bg-error/10 text-error' : 'bg-surface-container-low text-on-surface-variant'}`}>
      {diagnosisLoading ? 'Cargando diagnóstico y datos del predio desde la API…' : loadError || 'La API no devolvió un diagnóstico vigente para este lote.'}
    </p>;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {loadError && <p role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{loadError}</p>}
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
            
            <div className="flex items-center gap-2 bg-surface-container-low p-2 rounded-xl border border-surface-container">
              <MapPin className="text-primary-container w-5 h-5 ml-2" />
              <input 
                type="text" 
                defaultValue="04°38'19&quot;N, 75°44'22&quot;W · Lote Bellavista" 
                className="bg-transparent text-sm font-semibold w-full text-on-surface focus:outline-none"
              />
              <button className="bg-primary hover:bg-primary-container text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm">
                Localizar
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Objetivo de Reforestación Prioritario:</span>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm"><Droplet className="w-3 h-3"/> Protección Hídrica</span>
                <span className="px-3 py-1.5 bg-surface-container text-on-surface text-xs font-semibold rounded-full hover:bg-surface-container-high cursor-pointer transition-colors">Corredores Biológicos</span>
                <span className="px-3 py-1.5 bg-surface-container text-on-surface text-xs font-semibold rounded-full hover:bg-surface-container-high cursor-pointer transition-colors">Control de Erosión</span>
              </div>
            </div>
          </div>

          {/* Edaphic Matrix */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Análisis Fisicoquímico & Relieve</span>
                <h3 className="font-epilogue text-lg font-bold text-primary">Matriz Edáfica & Bioclimática</h3>
              </div>
              <span className="text-xs font-semibold bg-surface-container px-2 py-1 rounded-md text-secondary flex items-center gap-1">
                <Activity className="w-3 h-3"/> Muestra: 12h
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container">
                <div className="text-xs text-on-surface-variant font-semibold flex items-center justify-between">
                  Suelo & Acidez
                  <Target className="w-3 h-3 text-secondary" />
                </div>
                <div className="text-2xl font-epilogue font-bold text-primary mt-1 leading-none">pH 6.2</div>
                <div className="text-xs font-semibold text-secondary mt-1">Franco-arcilloso (Óptimo)</div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-3 overflow-hidden flex">
                  <div className="h-full bg-error w-1/4"></div>
                  <div className="h-full bg-secondary-container w-1/4"></div>
                  <div className="h-full bg-secondary w-1/4"></div>
                  <div className="h-full bg-tertiary w-1/4"></div>
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container">
                <div className="text-xs text-on-surface-variant font-semibold flex items-center justify-between">
                  Pérdida Cobertura
                  <Leaf className="w-3 h-3 text-error" />
                </div>
                <div className="text-2xl font-epilogue font-bold text-error mt-1 leading-none">-{coverageLoss}%</div>
                <div className="text-xs font-semibold text-on-surface-variant mt-1">Dosel fragmentado</div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-error w-[58%] rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-sm font-semibold text-on-surface">
                <CloudRain className="w-4 h-4 text-secondary"/> Precipitación: {precipitation.toLocaleString('es-CO')} mm/año
                </div>
                <span className="text-[10px] font-bold bg-surface-container-lowest px-2 py-0.5 rounded-full text-secondary shadow-sm">{rainfallRegime}</span>
              </div>
              {/* Fake chart */}
              <div className="h-16 flex items-end justify-between gap-1 mt-2">
                {months.map((value, i) => {
                const height = Math.max(10, Math.round(value / Math.max(...months, 1) * 100));
                return <div key={i} className={`w-full rounded-t-sm ${i >= 9 ? 'bg-secondary' : 'bg-primary-fixed-dim'}`} style={{ height: `${height}%` }} />;
                })}
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-on-surface-variant mt-1">
                <span>Ene</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span className="text-secondary font-bold">Nov</span>
              </div>
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
                  <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse"></div>
                  Cuenca Hidrográfica {String(basin?.nombre ?? 'Río Claro')}
                </h3>
                <span className="text-xs text-on-surface-variant font-semibold">Valle Central · Elevación: {String(basin?.elevacion_msnm ?? 1420)} msnm</span>
              </div>
              <div className="flex bg-surface-container-low p-1 rounded-lg">
                <button className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-md shadow-sm">Topográfica</button>
                <button className="px-3 py-1.5 text-on-surface-variant text-xs font-bold rounded-md hover:text-on-surface transition-colors">Hídrica</button>
                <button className="px-3 py-1.5 text-on-surface-variant text-xs font-bold rounded-md hover:text-on-surface transition-colors">Dosel NDVI</button>
              </div>
            </div>

            <div className="relative w-full h-[360px] md:h-[420px] rounded-xl overflow-hidden border border-surface-container-high bg-surface-container shadow-inner">
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=600&fit=crop" className="w-full h-full object-cover opacity-80" alt="Map" />
              {/* SVG Overlays to simulate UI map lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 20 0 C 30 50, 10 80, 50 100" stroke="#006c48" strokeWidth="1" fill="none" opacity="0.8"/>
                <polygon points="40,30 60,20 70,50 45,60" fill="#92f7c3" opacity="0.35" stroke="#006c48" strokeWidth="0.5"/>
              </svg>
              <div className="absolute top-[40%] left-[45%] -translate-x-1/2 -translate-y-1/2 bg-primary-container text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <TreePine className="w-4 h-4 text-secondary-container"/>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">Lote 01 Bellavista (3.4 Ha)</span>
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded w-fit mt-0.5 shadow-sm">Prioridad Alta</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md p-3 rounded-xl text-xs font-semibold shadow-md border border-surface-container">
                <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Convenciones</div>
                <div className="flex items-center gap-2 mb-1.5"><span className="w-3.5 h-3.5 bg-primary-container rounded"></span> Zona Prioritaria</div>
                <div className="flex items-center gap-2 mb-1.5"><span className="w-3.5 h-1.5 bg-secondary rounded-full"></span> Franja Riparia</div>
                <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-tertiary-fixed rounded"></span> Corredor Propuesto</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-surface-container-lowest rounded-lg shadow-sm"><Navigation className="w-5 h-5 text-secondary"/></div>
                <div>
                  <div className="text-xs text-on-surface-variant font-semibold">Franja Riparia Legal</div>
                  <div className="text-sm font-bold text-primary">{riparianWidth}m requeridos</div>
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
                <span className="text-xs text-on-primary-container font-semibold">Compatibilidad ecológica: {compatibility}%</span>
              </div>
              <h3 className="font-epilogue text-2xl md:text-3xl font-bold leading-tight">{suggestedSpecies} Especies Nativas Sugeridas</h3>
              <p className="text-sm text-on-primary-container mt-1">Se identificaron taxa especializados de raíces profundas (fijadores de ribera como <em className="italic opacity-80">Alnus acuminata</em>) adaptados al pH 6.2 y régimen de lluvias estacional.</p>
              {apiOptions.dataSource === 'api' && <span className="text-xs text-on-primary-container">Mapa: {zonesCount} zonas · {mapLayersCount} capas cartográficas disponibles</span>}
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
