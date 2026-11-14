import type { ApiRecord } from '../services/api';
import { Plus } from 'lucide-react';

type Props = {
  userName?: string;
  onLogout?: () => void;
  lots?: ApiRecord[];
  projects?: ApiRecord[];
  activeLotId?: string;
  activeProjectId?: string;
  onLotChange?: (id: string) => void;
  onProjectChange?: (id: string) => void;
  onAddLot?: () => void;
};

export default function TopBar({ userName, onLogout, lots = [], projects = [], activeLotId = '', activeProjectId = '', onLotChange, onProjectChange, onAddLot }: Props) {
  const initials = userName?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
  return (
    <header className="fixed top-0 left-0 md:left-72 right-0 h-16 md:h-20 bg-surface/80 backdrop-blur-xl shadow-sm z-40 flex items-center justify-between px-4 md:px-8 border-b border-surface-container">
      <div className="flex items-center gap-4">
        <div className="md:hidden font-epilogue font-bold text-primary text-xl flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded text-white flex items-center justify-center text-xs">E</div>
          ecorenace
        </div>
        <span className="hidden text-sm font-medium text-on-surface-variant md:inline">Espacio de trabajo</span>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        {lots.length > 0 && <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="active-lot">Lote activo</label>
          <select id="active-lot" aria-label="Cambiar lote" value={activeLotId} onChange={(event) => onLotChange?.(event.target.value)} className="max-w-32 rounded-xl border border-outline-variant bg-white px-2 py-2 text-xs font-semibold text-primary sm:max-w-44 sm:px-3 sm:text-sm">
            {lots.map((lot) => {
              const id = String(lot.id ?? lot.lote_id ?? '');
              const name = String(lot.nombre ?? lot.nombre_lote ?? id);
              return <option key={id} value={id}>{name}</option>;
            })}
          </select>
          {projects.length > 0 && <><label className="sr-only" htmlFor="active-project">Proyecto activo</label><select id="active-project" aria-label="Cambiar proyecto" value={activeProjectId} onChange={(event) => onProjectChange?.(event.target.value)} className="hidden max-w-40 rounded-xl border border-outline-variant bg-white px-3 py-2 text-xs font-semibold text-primary md:block">
            {projects.map((project) => {
              const id = String(project.id ?? project.proyecto_id ?? '');
              return <option key={id} value={id}>{String(project.nombre ?? 'Proyecto')}</option>;
            })}
          </select></>}
          {onAddLot && <button type="button" onClick={onAddLot} aria-label="Agregar predio y lote" title="Agregar predio y lote" className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-primary transition hover:bg-surface-container"><Plus size={17} /></button>}
        </div>}
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{initials}</span>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-sm font-semibold text-on-surface leading-tight">{userName || 'Custodio Forestal'}</span>
            <span className="text-[10px] text-on-surface-variant font-semibold">Sesión activa</span>
          </div>
        </div>
        {onLogout && <button onClick={onLogout} className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-primary">Salir</button>}
      </div>
    </header>
  );
}
