export default function TopBar({ userName, onLogout }: { userName?: string; onLogout?: () => void }) {
  const initials = userName?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
  return (
    <header className="fixed top-0 left-0 md:left-72 right-0 h-16 md:h-20 bg-surface/80 backdrop-blur-xl shadow-sm z-40 flex items-center justify-between px-4 md:px-8 border-b border-surface-container">
      <div className="flex items-center gap-4">
        <div className="md:hidden font-epilogue font-bold text-primary text-xl flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded text-white flex items-center justify-center text-xs">R</div>
          Reforest
        </div>
        <span className="hidden text-sm font-medium text-on-surface-variant md:inline">Espacio de trabajo</span>
      </div>
      
      <div className="flex items-center gap-3 md:gap-6">
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
