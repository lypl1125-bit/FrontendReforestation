import { Droplet, Compass, Leaf, Book, TreePine } from 'lucide-react';
import { ViewState } from '../types';

interface Props {
  currentView: ViewState;
  setCurrentView: (v: ViewState) => void;
}

export default function Sidebar({ currentView, setCurrentView }: Props) {
  const navItems = [
    { id: 'diagnostico', label: 'Diagnóstico & Ubicación', icon: Compass },
    { id: 'catalogo', label: 'Catálogo de Especies', icon: Leaf },
    { id: 'detalle', label: 'Guía de Siembra', icon: Book },
    { id: 'proyecto', label: 'Planificador & Proyecto', icon: TreePine },
  ] as const;

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex-col justify-between py-6 hidden md:flex border-r border-surface-container shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="px-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-epilogue font-bold">R</div>
          <div className="flex flex-col">
            <span className="font-epilogue font-bold text-primary tracking-tight text-lg leading-tight">Reforest</span>
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Seedling Epilogue</span>
          </div>
        </div>
        
        <div className="px-4">
          <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Droplet className="text-secondary w-5 h-5" />
              <div className="flex flex-col">
                <span className="text-xs text-on-surface-variant font-semibold">Cuenca Activa</span>
                <span className="text-sm text-on-surface font-semibold truncate max-w-[140px]">Subcuenca Río Claro</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold w-full text-left
                ${currentView === item.id 
                  ? 'bg-primary-container text-on-primary shadow-sm' 
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="px-4 flex flex-col gap-4">
        <div className="p-3 bg-surface-container-lowest rounded-xl flex items-center justify-between shadow-sm border border-surface-container">
          <div className="flex items-center gap-2">
            <Leaf className="text-tertiary-container w-5 h-5" />
            <div>
              <div className="text-xs text-on-surface-variant font-semibold">Suelo & pH Actual</div>
              <div className="text-sm text-on-surface font-semibold">6.4 pH · Óptimo</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2">
          <div className="w-2 h-2 rounded-full bg-secondary"></div>
          <span className="text-xs text-on-surface-variant font-semibold">Monitoreo Biológico v2.4</span>
        </div>
      </div>
    </aside>
  );
}
