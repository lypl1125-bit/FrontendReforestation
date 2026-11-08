import { Filter, Leaf, Droplet, TreePine, CheckCircle2, Check, RotateCcw, ImageOff } from 'lucide-react';
import { ViewState } from '../types';
import { useEffect, useMemo, useState } from 'react';
import { api, apiOptions, ApiRecord } from '../services/api';

const mockSpecies = [
  { id: '048e6b49-10f8-4aa5-b9b7-8f02317576d3', name: 'Guayacán Rosado', sci: 'Handroanthus chrysanthus', img: 'https://images.unsplash.com/photo-1521193089946-b338e5bc014c?w=600&h=400&fit=crop', comp: 98, tag: 'Dosel', features: ['Raíz profunda', 'Captura de carbono'] },
  { id: 'a1b20000-0000-4000-8000-000000000002', name: 'Aliso Andino', sci: 'Alnus acuminata', img: 'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=600&h=400&fit=crop', comp: 95, tag: 'Fijadora N2', features: ['Crecimiento rápido', 'Control de erosión'] },
  { id: 'a1b20000-0000-4000-8000-000000000003', name: 'Roble de Montaña', sci: 'Quercus costaricensis', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&h=400&fit=crop', comp: 92, tag: 'Clímax', features: ['Longevidad', 'Retención hídrica'] },
  { id: 'a1b20000-0000-4000-8000-000000000004', name: 'Arrayán / Murta', sci: 'Myrcianthes leucoxyla', img: 'https://images.unsplash.com/photo-1629196914216-53d9e87568bd?w=600&h=400&fit=crop', comp: 89, tag: 'Sotobosque', features: ['Alimento para fauna', 'Restauración de borde'] },
  { id: 'a1b20000-0000-4000-8000-000000000005', name: 'Cedro de Montaña', sci: 'Cedrela montana', img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=400&fit=crop', comp: 87, tag: 'Dosel Alto', features: ['Especie de dosel', 'Crecimiento medio'] },
  { id: 'a1b20000-0000-4000-8000-000000000006', name: 'Nogal Silvestre', sci: 'Juglans neotropica', img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop', comp: 85, tag: 'Dosel Clímax', features: ['Alimento para fauna', 'Longevidad'] },
];

type CatalogSpecies = {
  id: string;
  name: string;
  sci: string;
  img?: string;
  comp: number;
  tag: string;
  category: string;
  features: string[];
  filterTags: string[];
};

function stringsFrom(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return stringsFrom(item);
    if (typeof item !== 'object' || item === null) return [];
    const record = item as ApiRecord;
    return stringsFrom(record.nombre ?? record.nombre_comun ?? record.nombre_servicio ?? record.grupo_funcional ?? record.codigo);
  });
}

function fromApi(item: ApiRecord): CatalogSpecies {
  const scientificName = String(item.nombre_cientifico ?? '');
  const category = String(item.estrato_nombre ?? item.estrato ?? '');
  const group = stringsFrom(item.grupo_funcional_nombre ?? item.grupo_funcional);
  const services = stringsFrom(item.servicios_ecosistemicos);
  const features = [...new Set([...group, ...services])];
  const imageValue = item.imagen_url ?? item.image_url ?? item.foto_url;
  return {
    id: String(item.especie_id ?? item.id ?? ''),
    name: String(item.nombre_comun ?? 'Especie'),
    sci: scientificName,
    ...(typeof imageValue === 'string' && /^https?:\/\//i.test(imageValue) ? { img: imageValue } : {}),
    comp: Number(item.compatibilidad_pct ?? 0),
    tag: category || group[0] || 'Especie nativa',
    category,
    features,
    filterTags: features,
  };
}

export default function CatalogoView({ setCurrentView, setSelectedSpeciesId, selectedSpeciesIds, setSelectedSpeciesIds }: { setCurrentView: (v: ViewState) => void; setSelectedSpeciesId: (id: string) => void; selectedSpeciesIds: string[]; setSelectedSpeciesIds: (ids: string[]) => void }) {
  const [speciesList, setSpeciesList] = useState<CatalogSpecies[]>(apiOptions.dataSource === 'mock'
    ? mockSpecies.map((item) => ({ ...item, category: item.tag, filterTags: item.features }))
    : []);
  const selected = selectedSpeciesIds;
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(apiOptions.dataSource === 'api');
  const [diagnosticId, setDiagnosticId] = useState('');
  const [minimumCompatibility, setMinimumCompatibility] = useState(50);
  const [appliedMinimumCompatibility, setAppliedMinimumCompatibility] = useState(50);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (apiOptions.dataSource !== 'api') return;
    let active = true;
    const loadSpecies = async () => {
      try {
        const current = await api.getDiagnosticoVigente(apiOptions.loteId);
        const diagnosticId = String(current.id ?? '');
        if (!diagnosticId) throw new Error('El diagnóstico vigente no incluye su identificador.');
        const result = await api.getEspeciesSugeridas(diagnosticId, 50);
        const items = Array.isArray(result.especies) ? result.especies.map((item) => fromApi(item as ApiRecord)) : [];
        if (active) {
          setDiagnosticId(diagnosticId);
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

  const categories = useMemo(() => [...new Set<string>(speciesList.flatMap((item) => item.category ? [item.category] : []))].sort((a, b) => a.localeCompare(b, 'es')), [speciesList]);
  const availableTags = useMemo(() => [...new Set<string>(speciesList.flatMap((item) => item.filterTags))].sort((a, b) => a.localeCompare(b, 'es')), [speciesList]);
  const visibleSpecies = useMemo(() => speciesList.filter((item) => {
    if (item.comp < appliedMinimumCompatibility) return false;
    if (selectedCategory !== 'Todas' && item.category !== selectedCategory) return false;
    if (selectedTags.length > 0 && !selectedTags.some((tag) => item.filterTags.includes(tag))) return false;
    return true;
  }), [appliedMinimumCompatibility, selectedCategory, selectedTags, speciesList]);

  const toggleSelect = (id: string) => {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    setSelectedSpeciesIds(next);
  };

  const showDetail = (id: string) => {
    setSelectedSpeciesId(id);
    setCurrentView('detalle');
  };
  const applyCompatibility = async (minimum: number) => {
    setLoadError('');
    setLoading(true);
    try {
      if (apiOptions.dataSource === 'api' && diagnosticId) {
        const result = await api.getEspeciesSugeridas(diagnosticId, minimum);
        const items = Array.isArray(result.especies) ? result.especies.map((item) => fromApi(item as ApiRecord)) : [];
        setSpeciesList(items);
      }
      setAppliedMinimumCompatibility(minimum);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No fue posible aplicar el filtro de compatibilidad.');
    } finally {
      setLoading(false);
    }
  };
  const resetFilters = () => {
    setSelectedCategory('Todas');
    setSelectedTags([]);
    setMinimumCompatibility(50);
    void applyCompatibility(50);
  };
  const toggleTag = (tag: string) => {
    setSelectedTags((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]);
  };
  const averageCompatibility = visibleSpecies.length
    ? visibleSpecies.reduce((total, item) => total + item.comp, 0) / visibleSpecies.length
    : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-24 md:pb-0">
      <div className="bg-surface-container rounded-2xl p-6 border border-surface-container-high flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span> Recomendaciones del diagnóstico vigente
            </span>
          </div>
          {loadError && <p role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{loadError}</p>}
          {loading && <p role="status" className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">Cargando catálogo desde la API…</p>}
          <h1 className="font-epilogue text-2xl md:text-4xl font-bold text-primary tracking-tight">Catálogo de Especies Nativas</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-xl">Explora las especies sugeridas para el predio y consulta su compatibilidad con los datos disponibles del diagnóstico.</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container-high w-full md:w-auto shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-low text-primary rounded-full flex items-center justify-center"><Leaf className="w-5 h-5"/></div>
            <div>
              <div className="text-xl font-epilogue font-bold text-primary leading-none">{speciesList.length}</div>
              <div className="text-[10px] text-on-surface-variant font-semibold mt-1">Especies<br/>compatibles</div>
            </div>
          </div>
          <div className="w-px h-10 bg-surface-container"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tertiary-fixed text-tertiary rounded-full flex items-center justify-center"><Droplet className="w-5 h-5"/></div>
            <div>
              <div className="text-xl font-epilogue font-bold text-tertiary leading-none">{averageCompatibility.toFixed(1)}%</div>
              <div className="text-[10px] text-on-surface-variant font-semibold mt-1">Compatibilidad<br/>promedio visible</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {['Todas', ...categories].map((category) => <button
              key={category}
              type="button"
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${selectedCategory === category ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
            >{category}{category === 'Todas' ? ` (${speciesList.length})` : ''}</button>)}
          </div>
          <span className="text-xs text-on-surface-variant">{visibleSpecies.length} resultados</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="flex flex-col gap-6 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container lg:sticky lg:top-24 lg:col-span-3">
          <div className="flex justify-between items-center">
            <h3 className="font-epilogue font-bold text-primary flex items-center gap-2 text-lg"><Filter className="w-5 h-5"/> Filtros</h3>
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 text-xs text-secondary font-bold hover:underline"><RotateCcw className="h-3 w-3" />Restablecer</button>
          </div>
          
          <div className="flex flex-col gap-3">
            <label htmlFor="minimum-compatibility" className="text-sm font-bold text-on-surface">Compatibilidad mínima</label>
            <div className="flex items-center gap-3">
              <input id="minimum-compatibility" type="range" min="0" max="100" step="5" value={minimumCompatibility} onChange={(event) => setMinimumCompatibility(Number(event.target.value))} className="w-full accent-secondary" />
              <span className="w-12 text-right text-sm font-bold text-primary">{minimumCompatibility}%</span>
            </div>
            <button type="button" onClick={() => { void applyCompatibility(minimumCompatibility); }} disabled={loading} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-container disabled:opacity-50">
              {loading ? 'Aplicando…' : 'Aplicar compatibilidad'}
            </button>
            <p className="text-[11px] leading-4 text-on-surface-variant">Este filtro usa el puntaje de compatibilidad devuelto por el diagnóstico.</p>
            <p className="text-[11px] leading-4 text-on-surface-variant">No se muestra filtro de altitud: la API todavía no devuelve el rango altitudinal de cada especie.</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-on-surface">Funciones y servicios</span>
            {availableTags.length > 0
              ? <div className="flex flex-wrap gap-2">{availableTags.map((tag) => <button
                key={tag}
                type="button"
                aria-pressed={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${selectedTags.includes(tag) ? 'bg-primary text-white' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
              >{tag}</button>)}</div>
              : <p className="rounded-lg bg-surface-container-low p-3 text-xs leading-5 text-on-surface-variant">La API no proporcionó grupos funcionales ni servicios para estas especies.</p>}
          </div>
        </div>

        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleSpecies.map(sp => {
            const isSel = selected.includes(sp.id);
            return (
              <div key={sp.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container hover:shadow-md transition-shadow flex flex-col group">
                <div className="relative h-44 rounded-xl overflow-hidden mb-4 cursor-pointer" onClick={() => showDetail(sp.id)}>
                  {sp.img
                    ? <img src={sp.img} alt={sp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-800" aria-label={`No hay imagen disponible para ${sp.name}`}><ImageOff className="h-9 w-9 opacity-60" /></div>}
                  <div className="absolute top-2 left-2 bg-surface-container-lowest/90 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Leaf className="w-3.5 h-3.5 text-secondary"/> {sp.comp}% compatibilidad
                  </div>
                  <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                    {sp.tag}
                  </div>
                </div>
                
                <div className="flex flex-col flex-1">
                  <h3 className="font-epilogue font-bold text-xl text-primary leading-tight mb-1">{sp.name}</h3>
                  <span className="text-sm text-tertiary italic mb-3">{sp.sci}</span>
                  
                  {sp.features.length > 0
                    ? <div className="mb-4 flex flex-wrap gap-1.5">
                      {sp.features.map((feature) => <span key={feature} className="rounded-full bg-surface-container-low px-2.5 py-1 text-[10px] font-semibold text-on-surface-variant"><Droplet className="mr-1 inline h-3 w-3 text-secondary" />{feature}</span>)}
                    </div>
                    : <p className="mb-4 rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant">La API no incluye información funcional para esta especie.</p>}
                  
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
          {!loading && !loadError && visibleSpecies.length === 0 && <p className="col-span-full rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">No hay especies que coincidan con los filtros. Prueba a reducir la compatibilidad mínima o restablece los filtros.</p>}
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
                <span className="text-xs text-primary-fixed-dim font-semibold">La cantidad se define al configurar el plan</span>
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
