import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import DiagnosticoView from './views/DiagnosticoView';
import CatalogoView from './views/CatalogoView';
import DetalleView from './views/DetalleView';
import ProyectoView from './views/ProyectoView';
import LandingPage from './views/LandingPage';
import { LoginPage, RegisterPage } from './views/AuthPages';
import { ViewState } from './types';

type DemoUser = { name: string; email: string };

function readDemoUser(): DemoUser | null {
  try {
    const stored = sessionStorage.getItem('reforesta-demo-user');
    return stored ? JSON.parse(stored) as DemoUser : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [route, setRoute] = useState(window.location.pathname.replace(/\/+$/, '') || '/');
  const [user, setUser] = useState<DemoUser | null>(readDemoUser);
  const [currentView, setCurrentView] = useState<ViewState>('diagnostico');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('a1b20000-0000-4000-8000-000000000001');
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState([
    'a1b20000-0000-4000-8000-000000000001',
    'a1b20000-0000-4000-8000-000000000002',
    'a1b20000-0000-4000-8000-000000000003',
  ]);

  useEffect(() => {
    const syncRoute = () => setRoute(window.location.pathname.replace(/\/+$/, '') || '/');
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    if (route === '/app' && !user) {
      window.history.replaceState({}, '', '/login');
      setRoute('/login');
    } else if (!['/', '/login', '/register', '/app'].includes(route)) {
      window.history.replaceState({}, '', '/');
      setRoute('/');
    }
  }, [route, user]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const authenticate = (name: string, email: string) => {
    const demoUser = { name: name.trim() || email.split('@')[0], email };
    sessionStorage.setItem('reforesta-demo-user', JSON.stringify(demoUser));
    setUser(demoUser);
    navigate('/app');
  };

  const logout = () => {
    sessionStorage.removeItem('reforesta-demo-user');
    setUser(null);
    setCurrentView('diagnostico');
    navigate('/');
  };

  if (route === '/') return <LandingPage navigate={navigate} />;
  if (route === '/login') return <LoginPage navigate={navigate} onAuthenticated={authenticate} />;
  if (route === '/register') return <RegisterPage navigate={navigate} onAuthenticated={authenticate} />;
  if (!user) return <main className="min-h-screen bg-surface p-8 text-center text-sm text-on-surface-variant">Redirigiendo al acceso…</main>;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex w-full">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <div className="flex-1 flex flex-col md:ml-72 min-h-screen relative pb-16 md:pb-0 w-full">
        <TopBar userName={user?.name} onLogout={logout} />
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
