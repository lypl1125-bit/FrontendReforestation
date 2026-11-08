import { Compass, Leaf, TreePine } from 'lucide-react';
import { ViewState } from '../types';

interface Props {
  currentView: ViewState;
  setCurrentView: (v: ViewState) => void;
}

export default function BottomNav({ currentView, setCurrentView }: Props) {
  const navItems = [
    { id: 'diagnostico', label: 'Ubicación', icon: Compass },
    { id: 'catalogo', label: 'Especies', icon: Leaf },
    { id: 'proyecto', label: 'Proyecto', icon: TreePine },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-surface-container pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors
              ${currentView === item.id ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'fill-primary/20' : ''}`} />
            <span className={`text-[10px] font-semibold ${currentView === item.id ? 'font-bold' : ''}`}>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
