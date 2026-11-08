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
import { api, apiOptions, ApiError, AuthSession, AuthUser, parseAuthSession, parseAuthUser, setAccessToken } from './services/api';

const AUTH_STORAGE_KEY = 'reforesta-auth-session';
const DEMO_USER_KEY = 'reforesta-demo-user';

function readDemoUser(): AuthUser | null {
  try {
    const stored = sessionStorage.getItem(DEMO_USER_KEY);
    return stored ? JSON.parse(stored) as AuthUser : null;
  } catch {
    return null;
  }
}

function readStoredToken(): string | null {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const saved = storage.getItem(AUTH_STORAGE_KEY);
      if (!saved) continue;
      const value: unknown = JSON.parse(saved);
      if (typeof value === 'object' && value !== null && 'accessToken' in value && typeof value.accessToken === 'string') {
        return value.accessToken;
      }
    } catch {
      storage.removeItem(AUTH_STORAGE_KEY);
    }
  }
  return null;
}

export default function App() {
  const [route, setRoute] = useState(window.location.pathname.replace(/\/+$/, '') || '/');
  const [user, setUser] = useState<AuthUser | null>(apiOptions.dataSource === 'mock' ? readDemoUser() : null);
  const [authReady, setAuthReady] = useState(apiOptions.dataSource === 'mock');
  const [authError, setAuthError] = useState('');
  const [currentView, setCurrentView] = useState<ViewState>('diagnostico');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState<string[]>([]);

  useEffect(() => {
    const syncRoute = () => setRoute(window.location.pathname.replace(/\/+$/, '') || '/');
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    if (apiOptions.dataSource === 'mock') return;
    let active = true;
    const token = readStoredToken();
    if (!token) {
      setAuthReady(true);
      return () => { active = false; };
    }

    setAccessToken(token);
    api.getCurrentUser()
      .then((result) => {
        if (active) setUser(parseAuthUser(result));
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setAccessToken(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
        } else {
          setAuthError('No se pudo validar la sesión guardada. Comprueba que la API esté disponible e inténtalo de nuevo.');
        }
      })
      .finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (route === '/app' && !user) {
      window.history.replaceState({}, '', '/login');
      setRoute('/login');
    } else if (!['/', '/login', '/register', '/app'].includes(route)) {
      window.history.replaceState({}, '', '/');
      setRoute('/');
    }
  }, [route, user, authReady]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const authenticate = async (session: AuthSession, remember: boolean) => {
    if (apiOptions.dataSource === 'api') {
      setAccessToken(session.accessToken);
      const currentUser = parseAuthUser(await api.getCurrentUser());
      const storage = remember ? localStorage : sessionStorage;
      const otherStorage = remember ? sessionStorage : localStorage;
      otherStorage.removeItem(AUTH_STORAGE_KEY);
      storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken: session.accessToken }));
      setUser(currentUser);
      setAuthError('');
    } else {
      sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(session.user));
      setUser(session.user);
    }
    navigate('/app');
  };

  const login = async (email: string, password: string, remember: boolean) => {
    if (apiOptions.dataSource === 'mock') {
      await authenticate({ accessToken: '', user: { email, name: email.split('@')[0].replace(/[._-]/g, ' ') } }, false);
      return;
    }
    const result = await api.login(email, password);
    const session = parseAuthSession(result, email);
    if (!session) throw new Error('La API no devolvió un access token para esta sesión.');
    await authenticate(session, remember);
  };

  const register = async (fullName: string, email: string, password: string) => {
    if (apiOptions.dataSource === 'mock') {
      await authenticate({ accessToken: '', user: { email, name: fullName } }, false);
      return true;
    }
    const result = await api.register(email, password, fullName);
    const session = parseAuthSession(result, email);
    if (!session) return false;
    await authenticate(session, false);
    return true;
  };

  const logout = () => {
    sessionStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setAccessToken(null);
    setUser(null);
    setCurrentView('diagnostico');
    navigate('/');
  };

  if (route === '/') return <LandingPage navigate={navigate} />;
  if (route === '/login') return <LoginPage navigate={navigate} onLogin={login} sessionError={authError} />;
  if (route === '/register') return <RegisterPage navigate={navigate} onRegister={register} />;
  if (!authReady) return <main className="min-h-screen bg-surface p-8 text-center text-sm text-on-surface-variant">Verificando sesión…</main>;
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
