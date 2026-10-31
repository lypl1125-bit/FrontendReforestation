import { ArrowLeft, Leaf, Droplets, Sun, Ruler, CheckCircle2, ChevronRight, Sprout, ShieldAlert, Mountain, Clock } from 'lucide-react';
import { ViewState } from '../types';
import { useEffect, useState } from 'react';
import { api, apiOptions, ApiRecord } from '../services/api';

interface DetalleViewProps {
  setCurrentView: (view: ViewState) => void;
  selectedSpeciesId: string;
}

export default function DetalleView({ setCurrentView, selectedSpeciesId }: DetalleViewProps) {
  const [species, setSpecies] = useState<ApiRecord | null>(null);
  const [protocol, setProtocol] = useState<ApiRecord[]>([]);
  const [stock, setStock] = useState<ApiRecord[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (apiOptions.dataSource !== 'api' || !selectedSpeciesId) return;
    let active = true;
    setSpecies(null);
    setProtocol([]);
    setStock([]);
    setLoadError('');
    const load = async () => {
      try {
        const [detail, plantingProtocol, stockReport] = await Promise.all([
          api.getEspecie(selectedSpeciesId, apiOptions.loteId),
          api.getProtocoloEspecie(selectedSpeciesId),
          api.getStockEspecie(selectedSpeciesId, apiOptions.loteId),
        ]);
        if (!active) return;
        setSpecies(detail);
        setProtocol(Array.isArray(plantingProtocol.protocolo) ? plantingProtocol.protocolo as ApiRecord[] : []);
        setStock(Array.isArray(stockReport.viveros) ? stockReport.viveros as ApiRecord[] : []);
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'No fue posible cargar la ficha técnica.');
      }
    };
    void load();
    return () => { active = false; };
  }, [selectedSpeciesId]);

  const speciesName = String(species?.nombre_comun ?? 'Encina');
  const scientificName = String(species?.nombre_cientifico ?? 'Quercus ilex');
  const services = Array.isArray(species?.servicios_ecosistemicos) ? species.servicios_ecosistemicos as ApiRecord[] : [];
  const isApiSource = apiOptions.dataSource === 'api';
  const displayName = isApiSource && !species ? 'Cargando ficha…' : speciesName;
  const displayScientificName = isApiSource && !species ? '' : scientificName;
  const adjustment = species?.medidores_ajuste as ApiRecord | undefined;
  const altitudeAdjustment = adjustment?.altitud as ApiRecord | undefined;
  const phAdjustment = adjustment?.ph as ApiRecord | undefined;
  const compatibleTextures = Array.isArray(species?.texturas_compatibles)
    ? (species.texturas_compatibles as ApiRecord[]).map((texture) => String(texture.nombre ?? texture.codigo)).join(', ')
    : '';

  if (isApiSource && !species) {
    return (
      <div className="space-y-4">
        <button onClick={() => setCurrentView('catalogo')} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm">Volver al catálogo</button>
        <p role={loadError ? 'alert' : 'status'} className={`rounded-xl p-4 text-sm ${loadError ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
          {loadError || 'Cargando ficha técnica, protocolo y disponibilidad desde la API…'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => setCurrentView('catalogo')}
          className="p-2 rounded-xl bg-white border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Detalle de Especie</h1>
          <p className="text-sm text-gray-500">Guía de siembra y características</p>
        </div>
        {loadError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Hero and Quick Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Card */}
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="h-64 sm:h-80 relative">
              <img 
                src="https://images.unsplash.com/photo-1598466601248-ceeb10c97d66?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt={scientificName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex space-x-2">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-primary shadow-sm flex items-center">
                  <Leaf className="w-3 h-3 mr-1" />
                  Nativa
                </span>
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-amber-600 shadow-sm flex items-center">
                  <Droplets className="w-3 h-3 mr-1" />
                  Resistente
                </span>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 font-display mb-1">{displayName}</h2>
                  <p className="text-gray-500 italic font-medium">{displayScientificName}</p>
                </div>
                <button className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 flex items-center space-x-2">
                  <PlusIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Añadir al Proyecto</span>
                  <span className="sm:hidden">Añadir</span>
                </button>
              </div>
              
              <p className="text-gray-600 leading-relaxed">
                {String(species?.descripcion ?? (isApiSource ? '' : 'La encina es un árbol perennifolio nativo de la región mediterránea, conocido por su extrema resistencia a la sequía y su papel crucial en los ecosistemas forestales. Su denso follaje proporciona excelente sombra y refugio para la fauna local.'))}
              </p>
            </div>
          </div>

          {/* Cultivation Parameters */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Sprout className="w-5 h-5 mr-2 text-primary" />
              Parámetros de Cultivo
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-1">Riego</p>
                <p className="font-semibold text-gray-900">{species ? `${String(species.agua_inicial_l_planta ?? '—')} L/planta` : 'Bajo'}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                <Sun className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-1">Textura compatible</p>
                <p className="font-semibold text-gray-900">{compatibleTextures || 'Pleno Sol'}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                <Ruler className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-1">Espaciado</p>
                <p className="font-semibold text-gray-900">{species ? `${String(species.espaciado_m ?? '—')} m` : '15-20m'}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-1">Compost por hoyo</p>
                <p className="font-semibold text-gray-900">{species ? `${String(species.compost_kg_hoyo ?? '—')} kg` : 'Lento'}</p>
              </div>
            </div>
          </div>

          {/* Planting Guide */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 font-display">Guía de Siembra Paso a Paso</h3>
            
            <div className="space-y-6">
              {(protocol.length ? protocol.map((step, index) => ({
                step: Number(step.orden ?? index + 1),
                title: String(step.titulo ?? step.fase ?? `Paso ${index + 1}`),
                desc: String(step.descripcion ?? ''),
              })) : isApiSource ? [] : [
                { step: 1, title: 'Preparación del Terreno', desc: 'Despejar un área de 1m de diámetro alrededor del punto de plantación. Cava un hoyo el doble de ancho y profundo que el cepellón (aprox. 40x40x40cm).' },
                { step: 2, title: 'Acondicionamiento', desc: 'Mezclar la tierra extraída con un 20% de abono orgánico o compost. Si el suelo es muy arcilloso, añadir arena para mejorar el drenaje.' },
                { step: 3, title: 'Plantación', desc: 'Colocar el árbol asegurando que el cuello de la raíz quede a nivel del suelo. Rellenar con la mezcla de tierra compactando suavemente.' },
                { step: 4, title: 'Alcorque y Primer Riego', desc: 'Formar un pequeño caballón de tierra alrededor para retener el agua (alcorque). Realizar un primer riego abundante (15-20 litros).' }
              ]).map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
              {isApiSource && species && protocol.length === 0 && <p className="text-sm text-gray-500">La API no devolvió pasos de protocolo para esta especie.</p>}
            </div>
          </div>
        </div>

        {/* Right Column - Warnings & Compatibility */}
        <div className="space-y-6">
          
          <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Idoneidad del Sitio
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                <span className="text-sm text-gray-600">Textura del suelo</span>
                <span className="text-sm font-semibold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> {compatibleTextures ? 'Compatible' : 'Óptimo'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                <span className="text-sm text-gray-600">pH ({String(phAdjustment?.valor_lote ?? '—')})</span>
                <span className="text-sm font-semibold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> {String(phAdjustment?.estado ?? 'Adecuado')}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                <span className="text-sm text-gray-600">Altitud</span>
                <span className="text-sm font-semibold text-amber-600 flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-1" /> {String(altitudeAdjustment?.estado ?? 'Límite')}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                <span className="text-sm text-gray-600">Compatibilidad</span>
                <span className="text-sm font-semibold text-emerald-600">{String(species?.compatibilidad_pct ?? '—')}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{isApiSource ? 'Servicios Ecosistémicos' : 'Especies Compatibles'}</h3>
            <p className="text-sm text-gray-500 mb-4">{isApiSource ? 'Beneficios ambientales asociados a esta especie:' : 'Forma excelentes asociaciones simbióticas con:'}</p>
            
            <div className="space-y-3">
              {(services.length ? services.map((service) => String(service.nombre ?? service.codigo ?? 'Servicio ecosistémico')) : isApiSource ? [] : ['Romero (Rosmarinus)', 'Retama (Retama sphaerocarpa)', 'Pino Piñonero']).map((compatibleSpecies, i) => (
                <div key={i} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                     <img 
                      src={`https://images.unsplash.com/photo-1599818833989-18306dfda3e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`}
                      alt={compatibleSpecies}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors flex-1">{compatibleSpecies}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              ))}
              {isApiSource && species && services.length === 0 && <p className="text-sm text-gray-500">No hay servicios ecosistémicos registrados.</p>}
            </div>
            {stock.length > 0 && <p className="mt-4 text-xs text-gray-500">{String(stock[0].vivero_nombre ?? 'Vivero')}: {String(stock[0].stock_disponible ?? 0)} plántulas disponibles</p>}
          </div>

        </div>

      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
