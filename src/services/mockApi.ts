import type {
  ApiRecord,
  DiagnosticoCreate,
  EspecieSeleccionItem,
  ProyectoCreate,
  ZonaMapaCreate,
  ZonaMapaUpdate,
} from './api';

const DEMO_DIAGNOSTIC_ID = 'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b';
const DEMO_PROJECT_ID = '7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e';
const DEMO_NURSERY_ID = 'v1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c';

const species: ApiRecord[] = [
  { especie_id: 'a1b20000-0000-4000-8000-000000000001', codigo_taxon: 'HAN-CHR', nombre_comun: 'Guayacán Rosado', nombre_cientifico: 'Handroanthus chrysanthus', compatibilidad_pct: 98, es_nativa: true, estrato: 'Dosel', grupo_funcional: 'Captura CO2' },
  { especie_id: 'a1b20000-0000-4000-8000-000000000002', codigo_taxon: 'ALN-ACU', nombre_comun: 'Aliso Andino', nombre_cientifico: 'Alnus acuminata', compatibilidad_pct: 95, es_nativa: true, estrato: 'Fijadora N2', grupo_funcional: 'Control de erosión' },
  { especie_id: 'a1b20000-0000-4000-8000-000000000003', codigo_taxon: 'QUE-COS', nombre_comun: 'Roble de Montaña', nombre_cientifico: 'Quercus costaricensis', compatibilidad_pct: 92, es_nativa: true, estrato: 'Clímax', grupo_funcional: 'Retención hídrica' },
  { especie_id: 'a1b20000-0000-4000-8000-000000000004', codigo_taxon: 'MYR-LEU', nombre_comun: 'Arrayán / Murta', nombre_cientifico: 'Myrcianthes leucoxyla', compatibilidad_pct: 89, es_nativa: true, estrato: 'Sotobosque', grupo_funcional: 'Frugívoro' },
  { especie_id: 'a1b20000-0000-4000-8000-000000000005', codigo_taxon: 'CED-MON', nombre_comun: 'Cedro de Montaña', nombre_cientifico: 'Cedrela montana', compatibilidad_pct: 87, es_nativa: true, estrato: 'Dosel Alto', grupo_funcional: 'Crecimiento medio' },
  { especie_id: 'a1b20000-0000-4000-8000-000000000006', codigo_taxon: 'JUG-NEO', nombre_comun: 'Nogal Silvestre', nombre_cientifico: 'Juglans neotropica', compatibilidad_pct: 85, es_nativa: true, estrato: 'Dosel Clímax', grupo_funcional: 'Fruto silvestre' },
];

const diagnosis: ApiRecord = {
  id: DEMO_DIAGNOSTIC_ID,
  fecha: '2026-04-10T14:20:00',
  perdida_cobertura_pct: 42,
  franja_riparia_legal_m: 30,
  riesgo_acarreo: 'medio_alto',
  conectividad_fauna: 'interrumpido',
  precipitacion_anual_mm: 1850,
  precipitacion_mensual: [120, 95, 150, 180, 200, 80, 60, 70, 140, 190, 160, 100].map((precipitacion_mm, index) => ({ mes: index + 1, precipitacion_mm })),
  ventanas_siembra: [{ id: 'ventana-1', mes_inicio: 10, mes_fin: 12, nota: 'Octubre - Diciembre' }],
  zona_vida: { codigo: 'bh-MB', nombre: 'Bosque húmedo montano bajo', descripcion_microclima: 'Clima templado húmedo', recomendacion_siembra: 'Plantar al inicio de las lluvias' },
  regimen: { codigo: 'bimodal', nombre: 'Bimodal' },
  cobertura_remanente_pct: 58,
  total_especies_sugeridas: 14,
  compatibilidad_promedio_pct: 94,
};

const nurseries: ApiRecord[] = [
  { vivero_id: DEMO_NURSERY_ID, nombre: 'Vivero Forestal Andes Centrales', municipio: 'Ibagué', stock_total: 4500, contacto: 'vivero@andes.example' },
];

const zones: ApiRecord[] = [
  { type: 'Feature', id: 'f8a9b0c1-2d3e-4f5a-6b7c-8d9e0f1a2b3c', properties: { tipo: 'siembra_prioritaria', etiqueta: 'Ladera Norte - Alta Erosión' }, geometry: { type: 'Polygon', coordinates: [[[-75.291, 4.471], [-75.289, 4.471], [-75.289, 4.469], [-75.291, 4.469], [-75.291, 4.471]]] } },
];

let project: ApiRecord = {
  id: DEMO_PROJECT_ID,
  lote_id: 'lote-demo',
  nombre: 'Proyecto: Valle Verde',
  fase: 'borrador',
  patron: 'tresbolillo',
  espaciado_m: 3,
  area_restaurada_m2: 125000,
  vivero_id: DEMO_NURSERY_ID,
};
let projectSelections: EspecieSeleccionItem[] = [
  { especie_id: species[0].especie_id as string, zona_plantacion: 'dosel_alto', cantidad: 2475 },
  { especie_id: species[1].especie_id as string, zona_plantacion: 'ripario', cantidad: 1350 },
  { especie_id: species[2].especie_id as string, zona_plantacion: 'borde', cantidad: 675 },
];

function recordBody(init?: RequestInit): ApiRecord {
  return init?.body ? JSON.parse(String(init.body)) as ApiRecord : {};
}

function recordListBody(init?: RequestInit): ApiRecord[] {
  return init?.body ? JSON.parse(String(init.body)) as ApiRecord[] : [];
}

function notFound(message: string): never {
  throw new Error(message);
}

function speciesById(id: string): ApiRecord {
  const found = species.find((item) => item.especie_id === id);
  if (!found) return notFound(`No existe la especie ${id}.`);
  return found;
}

function selectedSpeciesWithDetails(): ApiRecord[] {
  return projectSelections.map((selection) => ({
    ...speciesById(selection.especie_id),
    ...selection,
    zona_nombre: selection.zona_plantacion.replaceAll('_', ' '),
  }));
}

function projectCalculation(): ApiRecord {
  const factor = project.patron === 'tresbolillo' ? Math.sqrt(3) / 2 : 1;
  const seedlings = selectedSpeciesWithDetails().map((item) => {
    const cantidad = Number(item.cantidad);
    const speciesId = String(item.especie_id);
    const seedlingSpecies = speciesById(speciesId);
    const spacing = Number(project.espaciado_m ?? 3);
    const compost = speciesId.endsWith('0005') ? 4 : 3;
    const water = speciesId.endsWith('0005') ? 15 : 12;
    const perWorker = speciesId.endsWith('0005') ? 18 : 20;
    return {
      especie_id: speciesId,
      codigo_taxon: seedlingSpecies.codigo_taxon,
      nombre_comun: seedlingSpecies.nombre_comun,
      nombre_cientifico: seedlingSpecies.nombre_cientifico,
      plantulas: cantidad,
      espaciado_m: spacing,
      compost_kg: cantidad * compost,
      agua_inicial_l: cantidad * water,
      jornales: cantidad / perWorker,
      area_aprox_m2: cantidad * spacing ** 2 * factor,
      stock_vivero: speciesId.endsWith('0002') ? 350 : 450,
    };
  });
  const sum = (key: string) => seedlings.reduce((total, item) => total + Number(item[key] ?? 0), 0);
  const plants = sum('plantulas');
  const area = sum('area_aprox_m2');
  const warnings = seedlings.flatMap((item) => {
    const demand = Number(item.plantulas);
    const stock = Number(item.stock_vivero);
    if (demand <= stock) return [];
    return [{
      especie_id: item.especie_id,
      codigo_taxon: item.codigo_taxon,
      nombre_comun: item.nombre_comun,
      requeridas: demand,
      stock_disponible: stock,
      deficit: demand - stock,
      mensaje: `Stock insuficiente en vivero: faltan ${demand - stock} plántulas para '${item.nombre_comun}'.`,
    }];
  });
  return {
    proyecto: {
      ...project,
      factor_patron: Number(factor.toFixed(3)),
      espaciado_base_m: project.espaciado_m,
      vivero_nombre: nurseries[0].nombre,
    },
    especies: seedlings,
    totales: {
      plantulas: plants,
      compost_kg: sum('compost_kg'),
      compost_bultos_25kg: Math.ceil(sum('compost_kg') / 25),
      agua_inicial_l: sum('agua_inicial_l'),
      jornales_estimados: Number(sum('jornales').toFixed(1)),
      area_calculada_m2: Number(area.toFixed(1)),
      area_calculada_ha: Number((area / 10000).toFixed(3)),
      cobertura_meta_pct: project.area_restaurada_m2 ? Number((area / Number(project.area_restaurada_m2) * 100).toFixed(1)) : 0,
    },
    advertencias_stock: warnings,
    formula_area: project.patron === 'tresbolillo' ? 'cant × espaciado² × 0.866 (tresbolillo)' : 'cant × espaciado²',
  };
}

export async function mockRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const url = new URL(path, 'http://mock.local');
  const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const body = recordBody(init);
  let result: unknown;

  if (method === 'GET' && segments.length === 0) result = { Msg: 'Welcome to the Reforestation API!' };
  else if (segments.join('/') === 'cuencas' && method === 'GET') {
    result = [{ id: 'cuenca-demo', nombre: 'Cuenca del Río Coello', descripcion: 'Zona de recarga hídrica', elevacion_msnm: 1850, altitud_min_msnm: 1200, altitud_max_msnm: 3200, geom: null }];
  } else if (segments.join('/') === 'cuencas' && method === 'POST') result = { id: crypto.randomUUID(), ...body };
  else if (segments[0] === 'lotes' && segments[2] === 'diagnostico' && method === 'GET') result = { ...diagnosis };
  else if (segments[0] === 'lotes' && segments[2] === 'diagnosticos' && segments.length === 3 && method === 'GET') {
    result = { lote_id: segments[1], diagnosticos: [{ ...diagnosis }] };
  } else if (segments[0] === 'lotes' && segments[2] === 'diagnosticos' && method === 'POST') {
    const diagnosticBody = body as DiagnosticoCreate;
    result = { ...diagnosis, ...diagnosticBody, id: crypto.randomUUID(), precipitacion_anual_mm: diagnosticBody.precipitacion_mensual.reduce((sum, value) => sum + value, 0) };
  } else if (segments[0] === 'diagnosticos' && segments[2] === 'especies-sugeridas' && method === 'GET') {
    const min = Number(url.searchParams.get('min') ?? 50);
    const limit = Number(url.searchParams.get('limit') ?? species.length);
    const filtered = species.filter((item) => Number(item.compatibilidad_pct) >= min).slice(0, limit);
    result = { diagnostico_id: segments[1], total: filtered.length, especies: filtered };
  } else if (segments[0] === 'diagnosticos' && segments[2] === 'recalcular' && method === 'POST') result = { diagnostico_id: segments[1], especies_recalculadas: species.length, especies: species };
  else if (segments.join('/') === 'mapa/capas' && method === 'GET') {
    result = [
      { id: 'topografica', nombre: 'Topográfica', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' },
      { id: 'satelital', nombre: 'Satelital', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
      { id: 'osm', nombre: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
      { id: 'ndvi', nombre: 'NDVI', url: '' },
    ];
  } else if (segments[0] === 'lotes' && segments[2] === 'ndvi' && method === 'GET') result = { lote_id: segments[1], fecha: url.searchParams.get('fecha'), ndvi_promedio: 0.68, serie: [] };
  else if (segments[0] === 'lotes' && segments[2] === 'zonas-mapa' && segments[3] === 'generar-franja' && method === 'POST') {
    result = { type: 'Feature', id: crypto.randomUUID(), properties: { tipo: 'franja_riparia', etiqueta: 'Franja riparia (30m)', ancho_m: 30 }, geometry: zones[0].geometry };
    zones.push(result as ApiRecord);
  } else if (segments[0] === 'lotes' && segments[2] === 'zonas-mapa' && method === 'GET') {
    const tipo = url.searchParams.get('tipo');
    result = { type: 'FeatureCollection', features: tipo ? zones.filter((zone) => (zone.properties as ApiRecord).tipo === tipo) : [...zones] };
  } else if (segments[0] === 'lotes' && segments[2] === 'zonas-mapa' && method === 'POST') {
    result = { type: 'Feature', id: crypto.randomUUID(), properties: { tipo: body.tipo, etiqueta: body.etiqueta }, geometry: (body as unknown as ZonaMapaCreate).geom };
    zones.push(result as ApiRecord);
  } else if (segments[0] === 'zonas-mapa' && method === 'PATCH') {
    const zone = zones.find((item) => item.id === segments[1]);
    if (!zone) return notFound(`No existe la zona ${segments[1]}.`);
    const update = body as ZonaMapaUpdate;
    const updated = { ...zone, properties: { ...(zone.properties as ApiRecord), ...(update.tipo ? { tipo: update.tipo } : {}), ...(update.etiqueta ? { etiqueta: update.etiqueta } : {}) }, ...(update.geom ? { geometry: update.geom } : {}) };
    zones[zones.indexOf(zone)] = updated;
    result = updated;
  } else if (segments[0] === 'zonas-mapa' && method === 'DELETE') {
    const index = zones.findIndex((zone) => zone.id === segments[1]);
    if (index < 0) return notFound(`No existe la zona ${segments[1]}.`);
    zones.splice(index, 1);
    result = { mensaje: 'Zona eliminada', id: segments[1] };
  } else if (segments[0] === 'especies' && segments.length === 2 && method === 'GET') {
    const item = speciesById(segments[1]);
    const protocols = [
      { fase: 'excavacion', orden: 1, titulo: 'Apertura del hoyo', descripcion: 'Excavar hoyo de 40x40x40 cm separando la capa superficial fértil.', herramientas_sugeridas: 'Palín y barra', tiempo_estimado_min: 15 },
      { fase: 'enmienda', orden: 2, titulo: 'Mezcla de sustrato y compost', descripcion: 'Incorporar compost bien descompuesto con tierra negra superficial.', herramientas_sugeridas: 'Pala', tiempo_estimado_min: 5 },
      { fase: 'plantacion', orden: 3, titulo: 'Plantación', descripcion: 'Ubicar la plántula y rellenar el hoyo compactando suavemente.', herramientas_sugeridas: 'Guantes', tiempo_estimado_min: 10 },
    ];
    result = { ...item, familia: 'Nativa', estrato_nombre: item.estrato, grupo_nombre: item.grupo_funcional, compost_kg_hoyo: 4, agua_inicial_l_planta: 15, plantulas_por_jornal: 18, espaciado_m: 3.5, descripcion: `${item.nombre_comun} es una especie nativa recomendada para la restauración ecológica.`, texturas_compatibles: [{ codigo: 'franco', nombre: 'Franco' }], servicios_ecosistemicos: [{ codigo: 'captura_carbono', nombre: 'Fijación de Carbono', descripcion: 'Contribuye a capturar carbono', metrica_valor: 28.5, metrica_unidad: 't CO2/ha/año' }], medidores_ajuste: { altitud: { valor_lote: 1850, rango_especie: '1200 - 2800 msnm', ajuste_pct: 95, estado: 'optimo' }, ph: { valor_lote: 6.2, rango_especie: '5.5 - 7.0', ajuste_pct: 90, estado: 'optimo' }, estado_general: 'optimo' }, protocolo: protocols };
  } else if (segments[0] === 'especies' && segments[2] === 'protocolo' && method === 'GET') {
    speciesById(segments[1]);
    const detail = await mockRequest<ApiRecord>(`/especies/${segments[1]}`);
    const protocol = Array.isArray(detail.protocolo) ? detail.protocolo : [];
    result = { especie_id: segments[1], total_pasos: protocol.length, protocolo: protocol };
  } else if (segments[0] === 'especies' && segments[2] === 'stock' && method === 'GET') {
    speciesById(segments[1]);
    result = { especie_id: segments[1], lote_referencia_id: url.searchParams.get('lote_id'), viveros: [{ vivero_id: DEMO_NURSERY_ID, vivero_nombre: nurseries[0].nombre, municipio: 'Ibagué', stock_disponible: 450, disponible: true, certificado_origen: 'Certificado ICA #48291', distancia_km: 14.8, actualizado_en: '2026-04-20' }] };
  } else if (segments.join('/') === 'viveros' && method === 'GET') result = nurseries;
  else if (segments[0] === 'especies' && segments[2] === 'ficha-tecnica' && method === 'POST') {
    speciesById(segments[1]);
    result = { id: crypto.randomUUID(), especie_id: segments[1], ...body, creado_en: new Date().toISOString() };
  } else if (segments[0] === 'lotes' && segments[2] === 'proyectos' && method === 'POST') {
    const input = body as ProyectoCreate;
    project = { ...input, id: crypto.randomUUID(), lote_id: segments[1], fase: 'borrador', patron: input.patron ?? 'tresbolillo', espaciado_m: input.espaciado_m ?? 3 };
    projectSelections = [];
    result = { ...project };
  } else if (segments[0] === 'proyectos' && segments[2] === 'especies' && segments.length === 3 && method === 'GET') {
    result = { proyecto_id: segments[1], total_plantulas: projectSelections.reduce((sum, item) => sum + item.cantidad, 0), especies: selectedSpeciesWithDetails() };
  } else if (segments[0] === 'proyectos' && segments[2] === 'especies' && segments.length === 3 && method === 'PUT') {
    const items = recordListBody(init) as unknown as EspecieSeleccionItem[];
    if (!items.length || items.some((item) => item.cantidad <= 0)) return notFound('La selección debe incluir cantidades mayores a cero.');
    items.forEach((item) => speciesById(item.especie_id));
    projectSelections = items;
    result = { proyecto_id: segments[1], total_plantulas: items.reduce((sum, item) => sum + item.cantidad, 0), especies: selectedSpeciesWithDetails() };
  } else if (segments[0] === 'proyectos' && segments[2] === 'especies' && segments.length === 3 && method === 'POST') {
    const item = body as unknown as EspecieSeleccionItem;
    speciesById(item.especie_id);
    if (item.cantidad <= 0) return notFound('La cantidad debe ser mayor a cero.');
    const index = projectSelections.findIndex((selected) => selected.especie_id === item.especie_id && selected.zona_plantacion === item.zona_plantacion);
    if (index < 0) projectSelections.push(item);
    else projectSelections[index] = item;
    result = { proyecto_id: segments[1], ...item };
  } else if (segments[0] === 'proyectos' && segments[2] === 'especies' && segments.length === 4 && method === 'DELETE') {
    const zone = url.searchParams.get('zona');
    const initialLength = projectSelections.length;
    projectSelections = projectSelections.filter((item) => item.especie_id !== segments[3] || (zone && item.zona_plantacion !== zone));
    result = { proyecto_id: segments[1], especie_id: segments[3], eliminados: initialLength - projectSelections.length };
  } else if (segments[0] === 'proyectos' && segments[2] === 'seleccion' && segments[3] === 'calculo' && method === 'GET') {
    result = projectCalculation();
  } else return notFound(`Ruta mock no implementada: ${method} ${path}`);

  return result as T;
}
