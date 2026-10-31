import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import DiagnosticoView from './views/DiagnosticoView';
import CatalogoView from './views/CatalogoView';
import DetalleView from './views/DetalleView';
import ProyectoView from './views/ProyectoView';
import { ViewState } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('diagnostico');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('a1b20000-0000-4000-8000-000000000001');
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState([
    'a1b20000-0000-4000-8000-000000000001',
    'a1b20000-0000-4000-8000-000000000002',
    'a1b20000-0000-4000-8000-000000000003',
  ]);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex w-full">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <div className="flex-1 flex flex-col md:ml-72 min-h-screen relative pb-16 md:pb-0 w-full">
        <TopBar />
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-24 max-w-7xl mx-auto w-full">
          {currentView === 'diagnostico' && <DiagnosticoView setCurrentView={setCurrentView} />}
          {currentView === 'catalogo' && <CatalogoView setCurrentView={setCurrentView} setSelectedSpeciesId={setSelectedSpeciesId} selectedSpeciesIds={selectedSpeciesIds} setSelectedSpeciesIds={setSelectedSpeciesIds} />}
          {currentView === 'detalle' && <DetalleView setCurrentView={setCurrentView} selectedSpeciesId={selectedSpeciesId} />}
          {currentView === 'proyecto' && <ProyectoView selectedSpeciesIds={selectedSpeciesIds} />}
        </main>
        <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
      </div>
    </div>
  );
}
