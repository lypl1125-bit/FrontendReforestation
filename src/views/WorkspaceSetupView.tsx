import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, CheckCircle2, MapPin, Sprout, Trees } from 'lucide-react';
import { api, type ApiRecord } from '../services/api';
import { positiveArea } from '../services/areaValidation';

type Props = {
  existingLots?: ApiRecord[];
  onComplete: (lot: ApiRecord, projectId?: string) => void;
  onCancel?: () => void;
};

const fieldClass = 'w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20';

export default function WorkspaceSetupView({ existingLots = [], onComplete, onCancel }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [createdLot, setCreatedLot] = useState<ApiRecord | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState('');
  const [addToExistingPredio, setAddToExistingPredio] = useState(false);
  const predios = existingLots.reduce<ApiRecord[]>((items, lot) => {
    const predioId = String(lot.predio_id ?? '');
    if (predioId && !items.some((item) => item.id === predioId)) {
      items.push({ id: predioId, nombre: lot.predio_nombre ?? 'Predio registrado' });
    }
    return items;
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const lotName = String(formData.get('lotName')).trim();
    const projectName = String(formData.get('projectName')).trim();
    const lotArea = positiveArea(formData.get('lotArea'));
    if (!projectName) {
      setError('Ingresa el nombre del proyecto.');
      return;
    }
    if (!lotArea) {
      setError('El área del lote debe ser positiva y tener máximo dos decimales.');
      return;
    }
    if (!lotName) {
      setError('Ingresa el nombre del lote.');
      return;
    }
    const predioArea = addToExistingPredio ? null : positiveArea(formData.get('predioArea'));
    if (!addToExistingPredio && !predioArea) {
      setError('El área del predio debe ser positiva y tener máximo dos decimales.');
      return;
    }
    const predioName = String(formData.get('predioName') ?? '').trim();
    const municipality = String(formData.get('municipality') ?? '').trim();
    const department = String(formData.get('department') ?? '').trim();
    if (!addToExistingPredio && (!predioName || !municipality || !department)) {
      setError('Completa el nombre del predio, el municipio y el departamento.');
      return;
    }
    if (predioArea !== null && lotArea > predioArea) {
      setError('El área del primer lote no puede superar el área total del predio.');
      return;
    }
    setSaving(true);
    setError('');
    setProjectError('');
    try {
      let lot: ApiRecord;
      if (addToExistingPredio) {
        const predioId = String(formData.get('existingPredio'));
        const selectedPredio = predios.find((item) => item.id === predioId);
        const response = await api.createLote(predioId, { codigo: lotName, nombre: lotName, area_ha: lotArea });
        lot = { ...response, predio_nombre: selectedPredio?.nombre ?? 'Predio registrado' };
      } else {
        if (predioArea === null) throw new Error('El área del predio es obligatoria.');
        const response = await api.createPredio({
          nombre: predioName,
          municipio: municipality,
          departamento: department,
          area_ha: predioArea,
          primer_lote: { nombre: lotName, area_ha: lotArea },
        });
        const rawLot = response.lote;
        if (typeof rawLot !== 'object' || rawLot === null || Array.isArray(rawLot)) {
          throw new Error('La API creó el predio, pero no devolvió el primer lote.');
        }
        lot = rawLot as ApiRecord;
      }
      const lotId = String(lot.id ?? lot.lote_id ?? '');
      if (!lotId) throw new Error('La API creó el lote sin devolver su identificador.');
      try {
        const project = await api.createProyecto(lotId, {
          nombre: projectName,
          patron: 'tresbolillo',
          espaciado_m: 3,
          area_restaurada_m2: Number(lot.area_ha ?? 0) * 10000,
        });
        const projectId = String(project.id ?? project.proyecto_id ?? '');
        if (!projectId) throw new Error('La API creó el proyecto sin devolver su identificador.');
        setCreatedProjectId(projectId);
      } catch (projectCreationError) {
        setProjectError(projectCreationError instanceof Error ? projectCreationError.message : 'No fue posible crear el proyecto inicial.');
      }
      setCreatedLot(lot);
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : 'No fue posible guardar el predio y el lote.');
    } finally {
      setSaving(false);
    }
  };

  if (createdLot) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-outline-variant/50 bg-white p-6 shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary"><CheckCircle2 size={34} /></div>
        <h1 className="mt-5 text-center font-epilogue text-3xl font-bold text-primary">Tu espacio ya está listo</h1>
        <p className="mt-2 text-center text-sm leading-6 text-on-surface-variant">
          Creamos <strong>{String(createdLot.nombre ?? 'tu lote')}</strong> dentro de {String(createdLot.predio_nombre ?? 'tu predio')}.
          {createdProjectId ? ' También quedó creado tu primer proyecto.' : ''}
        </p>
        {projectError && <p role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">El predio y el lote están guardados, pero no se pudo crear el proyecto inicial: {projectError} Puedes intentarlo desde el planificador.</p>}
        <button type="button" onClick={() => onComplete(createdLot, createdProjectId || undefined)} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-primary-container px-5 py-3.5 text-sm font-bold text-white transition hover:bg-primary">
          Ir a mi espacio de trabajo <ArrowRight size={17} />
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-outline-variant/50 bg-white p-6 shadow-sm sm:p-10">
      <div className="mb-8 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary"><Trees size={26} /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">Primeros pasos · 1 de 1</p>
          <h1 className="mt-1 font-epilogue text-2xl font-bold text-primary sm:text-3xl">Cuéntanos sobre tu predio</h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">Registra el terreno, crea tu primer lote y deja listo un proyecto para empezar a planear la restauración.</p>
        </div>
      </div>

      <form className="space-y-7" onSubmit={submit}>
        <div>
          {predios.length > 0 && <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-on-surface-variant"><input type="checkbox" checked={addToExistingPredio} onChange={(event) => setAddToExistingPredio(event.target.checked)} className="rounded border-outline-variant text-primary focus:ring-secondary" />Agregar el lote a un predio existente</label>}
          {addToExistingPredio ? <label className="space-y-1.5 text-xs font-semibold">Predio registrado<select className={fieldClass} name="existingPredio" required>{predios.map((predio) => <option key={String(predio.id)} value={String(predio.id)}>{String(predio.nombre)}</option>)}</select></label> : <>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary"><MapPin size={17} /> Predio o terreno</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold sm:col-span-2">Nombre del predio<input className={fieldClass} name="predioName" placeholder="Ej. Finca La Esperanza" required /></label>
            <label className="space-y-1.5 text-xs font-semibold">Municipio<input className={fieldClass} name="municipality" placeholder="Ej. Ibagué" required /></label>
            <label className="space-y-1.5 text-xs font-semibold">Departamento / región<input className={fieldClass} name="department" placeholder="Ej. Tolima" required /></label>
            <label className="space-y-1.5 text-xs font-semibold">Área total aproximada (ha)<input className={fieldClass} name="predioArea" type="number" min="0.01" step="any" placeholder="12.5" required /></label>
          </div>
          </>}
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary"><MapPin size={17} /> {addToExistingPredio ? 'Nuevo lote' : 'Primer lote'}</h2>
          <p className="mb-3 text-xs leading-5 text-on-surface-variant">Un predio puede tener varios lotes. Más adelante podrás agregar otros y alternar entre ellos.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold">Nombre del lote<input className={fieldClass} name="lotName" placeholder="Ej. Ladera norte" required /></label>
            <label className="space-y-1.5 text-xs font-semibold">Área del lote (ha)<input className={fieldClass} name="lotArea" type="number" min="0.01" step="any" placeholder="4.2" required /></label>
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary"><Sprout size={17} /> Primer proyecto</h2>
          <label className="space-y-1.5 text-xs font-semibold">Nombre del proyecto<input className={fieldClass} name="projectName" defaultValue="Mi proyecto de restauración" required /></label>
        </div>

        {error && <p role="alert" className="rounded-xl border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/50 pt-5 sm:flex-row sm:justify-between">
          {onCancel && <button type="button" onClick={onCancel} className="rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface">Ahora no</button>}
          <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 rounded-full bg-primary-container px-6 py-3 text-sm font-bold text-white transition hover:bg-primary disabled:cursor-wait disabled:opacity-60">
            {saving ? 'Guardando tu espacio…' : 'Crear mi espacio'} {!saving && <ArrowRight size={17} />}
          </button>
        </div>
      </form>
    </section>
  );
}
