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

export type AuthUser = {
  id?: string;
  email: string;
  name: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiOptions = {
  dataSource: 'mock' | 'api';
  baseUrl: string;
  loteId: string;
  testProjectId: string;
};

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;

export const apiOptions: ApiOptions = {
  dataSource: env.VITE_DATA_SOURCE === 'api' ? 'api' : 'mock',
  baseUrl: (env.VITE_API_BASE_URL ?? '').replace(/\/+$/, ''),
  loteId: env.VITE_LOTE_ID ?? 'lote-demo',
  testProjectId: env.VITE_TEST_PROJECT_ID ?? '',
};

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseAuthSession(value: unknown, emailFallback: string): AuthSession | null {
  if (!isRecord(value)) throw new Error('La API devolvió una respuesta de autenticación inválida.');
  const data = isRecord(value.data) ? value.data : value;
  const session = isRecord(data.session) ? data.session : data;
  const user = isRecord(data.user) ? data.user : isRecord(session.user) ? session.user : null;
  const token = session.access_token ?? session.accessToken ?? data.access_token;
  if (typeof token !== 'string' || !token) return null;
  const metadata = user && isRecord(user.user_metadata) ? user.user_metadata : {};
  const email = String(user?.email ?? emailFallback);
  const name = String(metadata.full_name ?? metadata.name ?? user?.full_name ?? user?.name ?? email.split('@')[0]);
  return {
    accessToken: token,
    user: {
      ...(typeof user?.id === 'string' ? { id: user.id } : {}),
      email,
      name,
    },
  };
}

export function parseAuthUser(value: unknown): AuthUser {
  if (!isRecord(value)) throw new Error('La API devolvió un perfil de usuario inválido.');
  const user = isRecord(value.user) ? value.user : value;
  const metadata = isRecord(user.user_metadata) ? user.user_metadata : {};
  const email = typeof user.email === 'string' ? user.email : '';
  if (!email) throw new Error('La API no devolvió el correo del usuario autenticado.');
  return {
    ...(typeof user.id === 'string' ? { id: user.id } : {}),
    email,
    name: String(metadata.full_name ?? metadata.name ?? user.full_name ?? user.name ?? email.split('@')[0]),
  };
}

async function request<T>(path: string, init?: RequestInit, authenticated = true): Promise<T> {
  if (apiOptions.dataSource === 'mock') return mockRequest<T>(path, init);
  if (!apiOptions.baseUrl) {
    throw new Error('Configura VITE_API_BASE_URL para conectarte a la API.');
  }

  const response = await fetch(`${apiOptions.baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(authenticated && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: unknown; message?: unknown; error_description?: unknown } | null;
    const message = [body?.detail, body?.message, body?.error_description].find((item) => typeof item === 'string');
    throw new ApiError(typeof message === 'string' ? message : `La API respondió con ${response.status} ${response.statusText}.`, response.status);
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
  login: (email: string, password: string) =>
    request<unknown>('/auth/login', json('POST', { email, password }), false),
  register: (email: string, password: string, fullName: string) =>
    request<unknown>('/auth/register', json('POST', { email, password, full_name: fullName }), false),
  getCurrentUser: () => request<unknown>('/auth/me'),
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
  getCapasMapa: () => request<unknown>('/mapa/capas'),
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
  getMezclaBotanica: (proyectoId: string, detalle = true) =>
    request<ApiRecord>(`/proyectos/${encodeURIComponent(proyectoId)}/mezcla-botanica${query({ detalle: String(detalle) })}`),
  getInsumosProyecto: (proyectoId: string) =>
    request<ApiRecord>(`/proyectos/${encodeURIComponent(proyectoId)}/insumos`),
  getCalculoProyecto: (proyectoId: string) =>
    request<ApiRecord>(`/proyectos/${encodeURIComponent(proyectoId)}/seleccion/calculo`),
};
