import { mockRequest } from './mockApi';

export type GeoJsonGeometry = {
  type: string;
  coordinates: unknown[];
};

export type ApiRecord = Record<string, unknown>;

export type DiagnosticoCreate = {
  muestra_suelo_id?: string;
  perdida_cobertura_pct: number;
  precipitacion_mensual: number[];
  regimen_precipitacion?: 'bimodal' | 'monomodal';
  franja_riparia_legal_m?: number;
  riesgo_acarreo?: 'bajo' | 'medio' | 'medio_alto' | 'alto';
  conectividad_fauna?: 'continuo' | 'parcial' | 'interrumpido';
  observaciones?: string;
};

export type ZonaMapaCreate = {
  tipo: 'siembra_prioritaria' | 'franja_riparia' | 'corredor_biologico';
  etiqueta?: string;
  geom: GeoJsonGeometry;
};

export type ZonaMapaUpdate = Partial<Omit<ZonaMapaCreate, 'geom'>> & {
  geom?: GeoJsonGeometry;
};

export type ProyectoCreate = {
  nombre: string;
  diagnostico_id?: string | null;
  vivero_id?: string;
  responsable_id?: string;
  fecha_inicio?: string;
  patron?: 'tresbolillo' | 'cuadrado' | 'rectangular';
  espaciado_m?: number;
  area_restaurada_m2?: number;
  hoyo_lado_cm?: number;
  hoyo_profundidad_cm?: number;
};

export type EspecieSeleccionItem = {
  especie_id: string;
  zona_plantacion: string;
  cantidad: number;
};

export type FichaExportCreate = {
  url?: string;
  generado_por?: string;
};

export type ApiOptions = {
  dataSource: 'mock' | 'api';
  baseUrl: string;
  loteId: string;
  projectId: string;
};

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;

export const apiOptions: ApiOptions = {
  dataSource: env.VITE_DATA_SOURCE === 'api' ? 'api' : 'mock',
  baseUrl: (env.VITE_API_BASE_URL ?? '').replace(/\/+$/, ''),
  loteId: env.VITE_LOTE_ID ?? 'lote-demo',
  projectId: env.VITE_PROJECT_ID ?? '',
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (apiOptions.dataSource === 'mock') return mockRequest<T>(path, init);
  if (!apiOptions.baseUrl) {
    throw new Error('Configura VITE_API_BASE_URL para conectarte a la API.');
  }

  const response = await fetch(`${apiOptions.baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail ?? `La API respondió con ${response.status} ${response.statusText}.`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : '';
};

export const api = {
  health: () => request<ApiRecord>('/'),
  listCuencas: () => request<ApiRecord[]>('/cuencas'),
  createCuenca: (body: ApiRecord) => request<ApiRecord>('/cuencas', json('POST', body)),
  createDiagnostico: (loteId: string, body: DiagnosticoCreate) =>
    request<ApiRecord>(`/lotes/${encodeURIComponent(loteId)}/diagnosticos`, json('POST', body)),
  getDiagnosticoVigente: (loteId: string) =>
    request<ApiRecord>(`/lotes/${encodeURIComponent(loteId)}/diagnostico`),
  listDiagnosticos: (loteId: string) =>
    request<ApiRecord>(`/lotes/${encodeURIComponent(loteId)}/diagnosticos`),
  getEspeciesSugeridas: (diagnosticoId: string, min = 50, limit?: number) =>
    request<ApiRecord>(`/diagnosticos/${encodeURIComponent(diagnosticoId)}/especies-sugeridas${query({ min, limit })}`),
  recalcularEspecies: (diagnosticoId: string) =>
    request<ApiRecord>(`/diagnosticos/${encodeURIComponent(diagnosticoId)}/recalcular`, json('POST')),
  getCapasMapa: () => request<ApiRecord[]>('/mapa/capas'),
  getNdvi: (loteId: string, fecha?: string) =>
    request<ApiRecord>(`/lotes/${encodeURIComponent(loteId)}/ndvi${query({ fecha })}`),
  getZonasMapa: (loteId: string, tipo?: ZonaMapaCreate['tipo']) =>
    request<ApiRecord>(`/lotes/${encodeURIComponent(loteId)}/zonas-mapa${query({ tipo })}`),
  createZonaMapa: (loteId: string, body: ZonaMapaCreate) =>
    request<ApiRecord>(`/lotes/${encodeURIComponent(loteId)}/zonas-mapa`, json('POST', body)),
  updateZonaMapa: (zonaId: string, body: ZonaMapaUpdate) =>
    request<ApiRecord>(`/zonas-mapa/${encodeURIComponent(zonaId)}`, json('PATCH', body)),
  deleteZonaMapa: (zonaId: string) =>
    request<ApiRecord>(`/zonas-mapa/${encodeURIComponent(zonaId)}`, json('DELETE')),
  generarFranjaRiparia: (loteId: string) =>
    request<ApiRecord>(`/lotes/${encodeURIComponent(loteId)}/zonas-mapa/generar-franja`, json('POST')),
  getEspecie: (especieId: string, loteId?: string) =>
    request<ApiRecord>(`/especies/${encodeURIComponent(especieId)}${query({ lote_id: loteId })}`),
  getProtocoloEspecie: (especieId: string) =>
    request<ApiRecord>(`/especies/${encodeURIComponent(especieId)}/protocolo`),
  getStockEspecie: (especieId: string, loteId?: string) =>
    request<ApiRecord>(`/especies/${encodeURIComponent(especieId)}/stock${query({ lote_id: loteId })}`),
  listViveros: () => request<ApiRecord[]>('/viveros'),
  exportFichaTecnica: (especieId: string, body?: FichaExportCreate) =>
    request<ApiRecord>(`/especies/${encodeURIComponent(especieId)}/ficha-tecnica`, json('POST', body)),
  createProyecto: (loteId: string, body: ProyectoCreate) =>
    request<ApiRecord>(`/lotes/${encodeURIComponent(loteId)}/proyectos`, json('POST', body)),
  replaceEspeciesProyecto: (proyectoId: string, body: EspecieSeleccionItem[]) =>
    request<ApiRecord>(`/proyectos/${encodeURIComponent(proyectoId)}/especies`, json('PUT', body)),
  addEspecieProyecto: (proyectoId: string, body: EspecieSeleccionItem) =>
    request<ApiRecord>(`/proyectos/${encodeURIComponent(proyectoId)}/especies`, json('POST', body)),
  removeEspecieProyecto: (proyectoId: string, especieId: string, zona?: string) =>
    request<ApiRecord>(`/proyectos/${encodeURIComponent(proyectoId)}/especies/${encodeURIComponent(especieId)}${query({ zona })}`, json('DELETE')),
  getEspeciesProyecto: (proyectoId: string) =>
    request<ApiRecord>(`/proyectos/${encodeURIComponent(proyectoId)}/especies`),
  getCalculoProyecto: (proyectoId: string) =>
    request<ApiRecord>(`/proyectos/${encodeURIComponent(proyectoId)}/seleccion/calculo`),
};
