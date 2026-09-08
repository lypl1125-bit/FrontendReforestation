import { Search, Sun, Bell } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="fixed top-0 left-0 md:left-72 right-0 h-16 md:h-20 bg-surface/80 backdrop-blur-xl shadow-sm z-40 flex items-center justify-between px-4 md:px-8 border-b border-surface-container">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
          <input 
            type="search" 
            placeholder="Buscar taxón, microclima, estrato..."
            className="w-full bg-surface-container-low pl-10 pr-4 py-2 rounded-full text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="md:hidden font-epilogue font-bold text-primary text-xl flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded text-white flex items-center justify-center text-xs">R</div>
          Reforest
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full">
          <Sun className="text-on-surface-variant w-4 h-4" />
          <span className="text-xs font-semibold text-on-surface">Estrato Dosel 75% Sol</span>
        </div>
        <button className="relative p-2 rounded-full hover:bg-surface-container transition-colors">
          <Bell className="text-on-surface-variant w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-surface"></span>
        </button>
        <div className="flex items-center gap-2">
          <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" alt="Profile" className="w-8 h-8 rounded-full object-cover border border-surface-container shadow-sm" />
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-sm font-semibold text-on-surface leading-tight">Dra. Elena V.</span>
            <span className="text-[10px] text-on-surface-variant font-semibold">Técnica Forestal Senior</span>
          </div>
        </div>
      </div>
    </header>
  );
}
