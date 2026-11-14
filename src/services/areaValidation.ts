export function positiveArea(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const area = Number(value);
  return Number.isFinite(area) && area > 0 ? area : null;
}
