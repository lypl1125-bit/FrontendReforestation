import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ApiRecord } from '../src/services/api.ts';
import { positiveArea } from '../src/services/areaValidation.ts';
import { createLotPolygon, getLotCenter, parseGpsCoordinate } from '../src/services/location.ts';
import { mockRequest } from '../src/services/mockApi.ts';

test('accepts only positive areas with at most two decimal places', () => {
  assert.equal(positiveArea('10'), 10);
  assert.equal(positiveArea('4.25'), 4.25);
  assert.equal(positiveArea('0'), null);
  assert.equal(positiveArea('-1'), null);
  assert.equal(positiveArea('1.234'), null);
  assert.equal(positiveArea('not-an-area'), null);
  assert.equal(positiveArea(null), null);
});

test('creates a predio, multiple lots, and projects scoped to each lot', async () => {
  const firstWorkspace = await mockRequest<ApiRecord>('/predios', {
    method: 'POST',
    body: JSON.stringify({
      nombre: 'Predio de prueba',
      municipio: 'Ibagué',
      departamento: 'Tolima',
      area_ha: 8,
      primer_lote: { nombre: 'Lote inicial', area_ha: 3 },
    }),
  });
  const firstLot = firstWorkspace.lote as ApiRecord;
  const firstLotId = String(firstLot.id);
  const predioId = String((firstWorkspace.predio as ApiRecord).id);

  assert.ok(firstLotId);
  const firstLotProjects = await mockRequest<ApiRecord>(`/lotes/${firstLotId}/proyectos`, {
    method: 'POST',
    body: JSON.stringify({ nombre: 'Proyecto inicial' }),
  });

  const secondLot = await mockRequest<ApiRecord>(`/predios/${predioId}/lotes`, {
    method: 'POST',
    body: JSON.stringify({ nombre: 'Lote secundario', area_ha: 2 }),
  });
  const secondLotId = String(secondLot.id);
  await mockRequest<ApiRecord>(`/lotes/${secondLotId}/proyectos`, {
    method: 'POST',
    body: JSON.stringify({ nombre: 'Proyecto secundario' }),
  });

  const lotResponse = await mockRequest<ApiRecord>('/lotes');
  const lots = lotResponse.lotes as ApiRecord[];
  const projects = await mockRequest<ApiRecord>(`/lotes/${firstLotId}/proyectos`);
  const secondLotProjects = await mockRequest<ApiRecord>(`/lotes/${secondLotId}/proyectos`);

  assert.ok(lots.some((lot) => String(lot.id) === firstLotId));
  assert.ok(lots.some((lot) => String(lot.id) === secondLotId));
  assert.equal(String(firstLotProjects.id), String((projects.proyectos as ApiRecord[])[0].id));
  assert.equal((secondLotProjects.proyectos as ApiRecord[]).length, 1);
});

test('creates a closed GeoJSON perimeter and rejects invalid polygons', () => {
  const points = [
    { lat: 4, lng: -75 },
    { lat: 4, lng: -74.99 },
    { lat: 4.01, lng: -74.99 },
    { lat: 4.01, lng: -75 },
  ];
  const polygon = createLotPolygon(points);
  assert.equal(polygon?.type, 'Polygon');
  assert.deepEqual(polygon?.coordinates, [[[-75, 4], [-74.99, 4], [-74.99, 4.01], [-75, 4.01], [-75, 4]]]);
  assert.deepEqual(getLotCenter(points), { lat: 4.005, lng: -74.995 });
  assert.equal(createLotPolygon(points.slice(0, 2)), null);
  assert.equal(createLotPolygon([{ lat: 4, lng: -75 }, { lat: 4.01, lng: -75 }, { lat: 4.02, lng: -75 }]), null);
});

test('persists and reads predio and lot location data in the mock API', async () => {
  const points = [
    { lat: 4.45, lng: -75.23 },
    { lat: 4.45, lng: -75.22 },
    { lat: 4.46, lng: -75.22 },
  ];
  const geometry = createLotPolygon(points);
  const lotLocation = getLotCenter(points);
  assert.ok(geometry);
  assert.ok(lotLocation);
  const predioLocation = { lat: 4.44, lng: -75.24 };

  const workspace = await mockRequest<ApiRecord>('/predios', {
    method: 'POST',
    body: JSON.stringify({
      nombre: 'Finca geográfica',
      municipio: 'Ibagué',
      departamento: 'Tolima',
      area_ha: 5,
      ubicacion: predioLocation,
      primer_lote: { nombre: 'Lote geográfico', area_ha: 2, ubicacion: lotLocation, geom: geometry },
    }),
  });
  const predio = workspace.predio as ApiRecord;
  const lot = workspace.lote as ApiRecord;

  const additionalGeometry = createLotPolygon([
    { lat: 4.47, lng: -75.21 },
    { lat: 4.47, lng: -75.2 },
    { lat: 4.48, lng: -75.2 },
  ]);
  const additionalLocation = getLotCenter([
    { lat: 4.47, lng: -75.21 },
    { lat: 4.47, lng: -75.2 },
    { lat: 4.48, lng: -75.2 },
  ]);
  assert.ok(additionalGeometry);
  assert.ok(additionalLocation);
  const additionalLot = await mockRequest<ApiRecord>(`/predios/${String(predio.id)}/lotes`, {
    method: 'POST',
    body: JSON.stringify({ nombre: 'Lote adicional', area_ha: 1, ubicacion: additionalLocation, geom: additionalGeometry }),
  });

  const savedLotsResponse = await mockRequest<ApiRecord>('/lotes');
  const savedLots = savedLotsResponse.lotes as ApiRecord[];
  const savedLot = savedLots.find((item) => item.id === lot.id);
  const savedAdditionalLot = savedLots.find((item) => item.id === additionalLot.id);
  assert.ok(savedLot);
  assert.ok(savedAdditionalLot);
  assert.deepEqual(savedLot.predio_ubicacion, { type: 'Point', coordinates: [predioLocation.lng, predioLocation.lat] });
  assert.deepEqual(savedLot.ubicacion, { type: 'Point', coordinates: [lotLocation.lng, lotLocation.lat] });
  assert.deepEqual(savedLot.geom, geometry);
  assert.deepEqual(parseGpsCoordinate(savedLot.predio_ubicacion), predioLocation);
  assert.deepEqual(parseGpsCoordinate(savedLot.ubicacion), lotLocation);
  assert.deepEqual(savedAdditionalLot.ubicacion, { type: 'Point', coordinates: [additionalLocation.lng, additionalLocation.lat] });
  assert.deepEqual(savedAdditionalLot.geom, additionalGeometry);
});
