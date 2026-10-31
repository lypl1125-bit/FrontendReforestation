import { Filter, Leaf, Droplet, TreePine, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import { ViewState } from '../types';
import { useEffect, useState } from 'react';
import { api, apiOptions, ApiRecord } from '../services/api';

const mockSpecies = [
  { id: 'a1b20000-0000-4000-8000-000000000001', name: 'Guayacán Rosado', sci: 'Handroanthus chrysanthus', img: 'https://images.unsplash.com/photo-1521193089946-b338e5bc014c?w=600&h=400&fit=crop', comp: 98, tag: 'Dosel', features: ['Raíz profunda', 'Captura CO2'] },
  { id: 'a1b20000-0000-4000-8000-000000000002', name: 'Aliso Andino', sci: 'Alnus acuminata', img: 'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=600&h=400&fit=crop', comp: 95, tag: 'Fijadora N2', features: ['Crec. Rápido', 'Control erosión'] },
  { id: 'a1b20000-0000-4000-8000-000000000003', name: 'Roble de Montaña', sci: 'Quercus costaricensis', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&h=400&fit=crop', comp: 92, tag: 'Clímax', features: ['Longevidad', 'Retención hídrica'] },
  { id: 'a1b20000-0000-4000-8000-000000000004', name: 'Arrayán / Murta', sci: 'Myrcianthes leucoxyla', img: 'https://images.unsplash.com/photo-1629196914216-53d9e87568bd?w=600&h=400&fit=crop', comp: 89, tag: 'Sotobosque', features: ['Pedregosidad', 'Frugívoro'] },
  { id: 'a1b20000-0000-4000-8000-000000000005', name: 'Cedro de Montaña', sci: 'Cedrela montana', img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=400&fit=crop', comp: 87, tag: 'Dosel Alto', features: ['Madera', 'Crec. Medio'] },
  { id: 'a1b20000-0000-4000-8000-000000000006', name: 'Nogal Silvestre', sci: 'Juglans neotropica', img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop', comp: 85, tag: 'Dosel Clímax', features: ['Fruto silvestre', 'Longevidad'] },
];

type CatalogSpecies = (typeof mockSpecies)[number];

function fromApi(item: ApiRecord): CatalogSpecies {
  const scientificName = String(item.nombre_cientifico ?? '');
  const image = mockSpecies.find((mock) => mock.sci.toLowerCase() === scientificName.toLowerCase())?.img ?? mockSpecies[0].img;
  return {
    id: String(item.especie_id ?? item.id ?? ''),
    name: String(item.nombre_comun ?? 'Especie'),
    sci: scientificName,
    img: image,
    comp: Number(item.compatibilidad_pct ?? 0),
    tag: String(item.estrato ?? item.grupo_funcional ?? 'Nativa'),
    features: [String(item.estrato ?? 'Especie nativa'), String(item.grupo_funcional ?? item.motivo_compatibilidad ?? 'Restauración ecológica')],
  };
}

export default function CatalogoView({ setCurrentView, setSelectedSpeciesId, selectedSpeciesIds, setSelectedSpeciesIds }: { setCurrentView: (v: ViewState) => void; setSelectedSpeciesId: (id: string) => void; selectedSpeciesIds: string[]; setSelectedSpeciesIds: (ids: string[]) => void }) {
  const [speciesList, setSpeciesList] = useState<CatalogSpecies[]>(apiOptions.dataSource === 'mock' ? mockSpecies : []);
  const selected = selectedSpeciesIds;
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(apiOptions.dataSource === 'api');

  useEffect(() => {
    if (apiOptions.dataSource !== 'api') return;
    let active = true;
    const loadSpecies = async () => {
      try {
        const current = await api.getDiagnosticoVigente(apiOptions.loteId);
        const diagnosticId = String(current.id ?? '');
        if (!diagnosticId) throw new Error('El diagnóstico vigente no incluye su identificador.');
        const result = await api.getEspeciesSugeridas(diagnosticId);
        const items = Array.isArray(result.especies) ? result.especies.map((item) => fromApi(item as ApiRecord)) : [];
        if (active) {
          setSpeciesList(items);
          setSelectedSpeciesIds(selectedSpeciesIds.filter((id) => items.some((item) => item.id === id)));
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'No fue posible cargar el catálogo.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadSpecies();
    return () => { active = false; };
  }, []);

  const toggleSelect = (id: string) => {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    setSelectedSpeciesIds(next);
  };

  const showDetail = (id: string) => {
    setSelectedSpeciesId(id);
    setCurrentView('detalle');
  };
  const averageCompatibility = speciesList.length
    ? speciesList.reduce((total, item) => total + item.comp, 0) / speciesList.length
    : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-24 md:pb-0">
      <div className="bg-surface-container rounded-2xl p-6 border border-surface-container-high flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span> Subcuenca Río Claro · 1,850 - 2,400 msnm
            </span>
          </div>
          {loadError && <p role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{loadError}</p>}
          {loading && <p role="status" className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">Cargando catálogo desde la API…</p>}
          <h1 className="font-epilogue text-2xl md:text-4xl font-bold text-primary tracking-tight">Catálogo de Especies Nativas</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-xl">Taxones seleccionados algorítmicamente según balance hídrico y suelo franco-arenoso con pH 6.4.</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container-high w-full md:w-auto shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-low text-primary rounded-full flex items-center justify-center"><Leaf className="w-5 h-5"/></div>
            <div>
              <div className="text-xl font-epilogue font-bold text-primary leading-none">{speciesList.length}</div>
              <div className="text-[10px] text-on-surface-variant font-semibold mt-1">Taxones<br/>optimizados</div>
            </div>
          </div>
          <div className="w-px h-10 bg-surface-container"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tertiary-fixed text-tertiary rounded-full flex items-center justify-center"><Droplet className="w-5 h-5"/></div>
            <div>
              <div className="text-xl font-epilogue font-bold text-tertiary leading-none">{averageCompatibility.toFixed(1)}%</div>
              <div className="text-[10px] text-on-surface-variant font-semibold mt-1">Afinidad<br/>promedio</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-surface-container flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
          <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap shadow-sm">Todas ({speciesList.length})</button>
          <button className="bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-1.5 transition-colors"><TreePine className="w-4 h-4 text-secondary"/> Árboles de Dosel</button>
          <button className="bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-1.5 transition-colors"><Leaf className="w-4 h-4 text-tertiary-container"/> Pioneras Rápidas</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container sticky top-24">
          <div className="flex justify-between items-center">
            <h3 className="font-epilogue font-bold text-primary flex items-center gap-2 text-lg"><Filter className="w-5 h-5"/> Filtros</h3>
            <span className="text-xs text-secondary font-bold cursor-pointer hover:underline">Restablecer</span>
          </div>
          
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-on-surface">Piso Altitudinal</span>
            <div className="flex flex-col gap-2">
               <div className="h-1.5 w-full bg-surface-container rounded-full relative">
                 <div className="absolute left-1/4 right-1/4 h-full bg-secondary rounded-full"></div>
               </div>
               <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                 <span>1,200m</span> <span>1,900-2,300m</span> <span>3,200m</span>
               </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-on-surface">Servicios Ecosistémicos</span>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-surface-container text-xs font-semibold rounded-md">Cosecha de Agua</span>
              <span className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md">Fijación N2</span>
              <span className="px-3 py-1.5 bg-surface-container text-xs font-semibold rounded-md">Aves & Fauna</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {speciesList.map(sp => {
            const isSel = selected.includes(sp.id);
            return (
              <div key={sp.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container hover:shadow-md transition-shadow flex flex-col group">
                <div className="relative h-44 rounded-xl overflow-hidden mb-4 cursor-pointer" onClick={() => showDetail(sp.id)}>
                  <img src={sp.img} alt={sp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 bg-surface-container-lowest/90 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Leaf className="w-3.5 h-3.5 text-secondary"/> {sp.comp}% Comp
                  </div>
                  <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                    {sp.tag}
                  </div>
                </div>
                
                <div className="flex flex-col flex-1">
                  <h3 className="font-epilogue font-bold text-xl text-primary leading-tight mb-1">{sp.name}</h3>
                  <span className="text-sm text-tertiary italic mb-3">{sp.sci}</span>
                  
                  <div className="flex flex-col gap-2 bg-surface-container-low p-3 rounded-xl mb-4 text-[10px] font-semibold text-on-surface-variant mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-secondary"/> {sp.features[0]}</span>
                      <span className="text-primary font-bold">{sp.features[1]}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-auto">
                    <button 
                      onClick={() => showDetail(sp.id)}
                      className="flex-1 py-2.5 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-full transition-colors"
                    >
                      Ficha
                    </button>
                    <button 
                      onClick={() => toggleSelect(sp.id)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all
                        ${isSel ? 'bg-secondary text-white' : 'bg-primary text-white'}`}
                    >
                      {isSel ? <><Check className="w-4 h-4"/> Añadido</> : <><Filter className="w-4 h-4"/> Añadir</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {!loading && !loadError && speciesList.length === 0 && <p className="col-span-full rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">La API no devolvió especies compatibles para este diagnóstico.</p>}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-[320px] md:right-8 z-40">
          <div className="bg-primary text-white px-6 md:px-8 py-4 md:py-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center">
                <TreePine className="w-6 h-6 text-secondary-container"/>
              </div>
              <div className="flex flex-col">
                <span className="font-epilogue font-bold text-lg md:text-xl leading-tight">{selected.length} Especies seleccionadas</span>
                <span className="text-xs text-primary-fixed-dim font-semibold">~{selected.length * 40} Plántulas sugeridas</span>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('proyecto')}
              className="w-full sm:w-auto px-6 py-3 bg-secondary-fixed text-on-secondary-fixed-variant font-bold rounded-full flex items-center justify-center gap-2 active:scale-95 text-sm"
            >
              Configurar Plan de Siembra <CheckCircle2 className="w-5 h-5"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
