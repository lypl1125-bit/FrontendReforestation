import type { GeoJsonGeometry, GpsCoordinate } from './api';

export function parseGpsCoordinate(value: unknown): GpsCoordinate | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.type === 'Point' && Array.isArray(record.coordinates)) {
    const [lngValue, latValue] = record.coordinates;
    const lat = Number(latValue);
    const lng = Number(lngValue);
    return Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180
      ? { lat, lng }
      : null;
  }
  const lat = Number(record.lat);
  const lng = Number(record.lng);
  return Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180
    ? { lat, lng }
    : null;
}

export function createLotPolygon(points: GpsCoordinate[]): GeoJsonGeometry | null {
  if (points.length < 3 || new Set(points.map(({ lat, lng }) => `${lat},${lng}`)).size < 3) return null;
  if (points.some(({ lat, lng }) =>
    !Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180,
  )) return null;

  const ring = points.map(({ lat, lng }) => [lng, lat]);
  const twiceArea = ring.reduce((area, point, index) => {
    const nextPoint = ring[(index + 1) % ring.length];
    return area + point[0] * nextPoint[1] - nextPoint[0] * point[1];
  }, 0);
  if (Math.abs(twiceArea) < 1e-10) return null;
  const firstPoint = ring[0];
  if (!firstPoint) return null;
  ring.push([...firstPoint]);

  return { type: 'Polygon', coordinates: [ring] };
}

export function getLotCenter(points: GpsCoordinate[]): GpsCoordinate | null {
  const polygon = createLotPolygon(points);
  if (!polygon) return null;
  const ring = polygon.coordinates[0];
  if (!Array.isArray(ring)) return null;
  const openRing = ring.slice(0, -1) as number[][];
  let twiceArea = 0;
  let longitudeTotal = 0;
  let latitudeTotal = 0;
  for (let index = 0; index < openRing.length; index += 1) {
    const point = openRing[index];
    const nextPoint = openRing[(index + 1) % openRing.length];
    if (!point || !nextPoint) return null;
    const cross = point[0] * nextPoint[1] - nextPoint[0] * point[1];
    twiceArea += cross;
    longitudeTotal += (point[0] + nextPoint[0]) * cross;
    latitudeTotal += (point[1] + nextPoint[1]) * cross;
  }
  if (Math.abs(twiceArea) < 1e-10) return null;
  return {
    lng: Number((longitudeTotal / (3 * twiceArea)).toFixed(6)),
    lat: Number((latitudeTotal / (3 * twiceArea)).toFixed(6)),
  };
}
