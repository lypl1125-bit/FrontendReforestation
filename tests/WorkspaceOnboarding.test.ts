import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ApiRecord } from '../src/services/api.ts';
import { positiveArea } from '../src/services/areaValidation.ts';
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
