import { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import DiagnosticoView from './views/DiagnosticoView';
import CatalogoView from './views/CatalogoView';
import DetalleView from './views/DetalleView';
import ProyectoView from './views/ProyectoView';
import LandingPage from './views/LandingPage';
import WorkspaceSetupView from './views/WorkspaceSetupView';
import { LoginPage, RegisterPage } from './views/AuthPages';
import { ViewState } from './types';
import { api, apiOptions, ApiError, AuthSession, AuthUser, ApiRecord, parseAuthSession, parseAuthUser, setAccessToken } from './services/api';

const AUTH_STORAGE_KEY = 'reforesta-auth-session';
const DEMO_USER_KEY = 'reforesta-demo-user';
const ACTIVE_LOT_KEY = 'reforesta-active-lot';

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRecords(value: unknown, key: string): ApiRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  const records = value[key] ?? value.items ?? value.results;
  return Array.isArray(records) ? records.filter(isRecord) : [];
}

function idOf(record: ApiRecord): string {
  return String(record.id ?? record.lote_id ?? record.proyecto_id ?? '');
}

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
  const [googleCallbackError, setGoogleCallbackError] = useState('');
  const [googleCallbackLoading, setGoogleCallbackLoading] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('diagnostico');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState<string[]>([]);
  const [lots, setLots] = useState<ApiRecord[]>([]);
  const [projects, setProjects] = useState<ApiRecord[]>([]);
  const [activeLotId, setActiveLotId] = useState('');
  const [activeProjectId, setActiveProjectId] = useState('');
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [workspaceReload, setWorkspaceReload] = useState(0);
  const handledGoogleCode = useRef('');

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
    if (route.startsWith('/app') && !user) {
      window.history.replaceState({}, '', '/login');
      setRoute('/login');
    } else if (!['/', '/login', '/register', '/app', '/app/setup', '/auth/callback'].includes(route)) {
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
      return true;
    }
    const result = await api.register(email, password, fullName);
    const session = parseAuthSession(result, email);
    return session !== null;
  };

  const startGoogleAuth = async () => {
    if (apiOptions.dataSource !== 'api' || !apiOptions.googleAuthEnabled) {
      throw new Error('El inicio con Google no está habilitado para este entorno.');
    }
    const response = await api.startGoogleAuth();
    const authorizationUrl = new URL(response.authorization_url);
    if (!['https:', 'http:'].includes(authorizationUrl.protocol)) {
      throw new Error('La API devolvió una URL de autorización no válida.');
    }
    window.location.assign(authorizationUrl.toString());
  };

  useEffect(() => {
    if (route !== '/auth/callback') return;
    const callbackUrl = new URL(window.location.href);
    const code = callbackUrl.searchParams.get('code') ?? '';
    if (!code) {
      setGoogleCallbackError('No se recibió el código de autorización. Intenta iniciar sesión de nuevo.');
      return;
    }
    if (handledGoogleCode.current === code) return;
    handledGoogleCode.current = code;
    setGoogleCallbackLoading(true);
    setGoogleCallbackError('');
    api.exchangeGoogleCode(code)
      .then((response) => {
        const session = parseAuthSession(response, '');
        if (!session) throw new Error('El backend no devolvió una sesión válida de Google.');
        window.history.replaceState({}, '', '/auth/callback');
        return authenticate(session, false);
      })
      .catch((error: unknown) => {
        setGoogleCallbackError(error instanceof Error ? error.message : 'No fue posible completar el acceso con Google.');
      })
      .finally(() => setGoogleCallbackLoading(false));
  }, [route]);

  useEffect(() => {
    if (!user || !route.startsWith('/app')) return;
    let active = true;
    setWorkspaceReady(false);
    setWorkspaceError('');
    api.listLotes()
      .then((result) => {
        if (!active) return;
        const nextLots = readRecords(result, 'lotes');
        setLots(nextLots);
        const savedLotId = localStorage.getItem(`${ACTIVE_LOT_KEY}:${user.id ?? user.email}`);
        const selectedLot = nextLots.find((lot) => idOf(lot) === activeLotId)
          ?? nextLots.find((lot) => idOf(lot) === savedLotId)
          ?? nextLots[0];
        setActiveLotId(selectedLot ? idOf(selectedLot) : '');
        if (!selectedLot) {
          setProjects([]);
          setActiveProjectId('');
        }
      })
      .catch((error: unknown) => {
        if (active) setWorkspaceError(error instanceof Error ? error.message : 'No fue posible cargar tus lotes.');
      })
      .finally(() => { if (active) setWorkspaceReady(true); });
    return () => { active = false; };
  }, [user?.id, user?.email, route, workspaceReload]);

  useEffect(() => {
    if (!user || !activeLotId || !route.startsWith('/app')) return;
    let active = true;
    setWorkspaceError('');
    api.listProyectos(activeLotId)
      .then((result) => {
        if (!active) return;
        const nextProjects = readRecords(result, 'proyectos');
        setProjects(nextProjects);
        const selectedProject = nextProjects.find((project) => idOf(project) === activeProjectId) ?? nextProjects[0];
        setActiveProjectId(selectedProject ? idOf(selectedProject) : '');
      })
      .catch((error: unknown) => {
        if (active) setWorkspaceError(error instanceof Error ? error.message : 'No fue posible cargar los proyectos del lote.');
      });
    return () => { active = false; };
  }, [user?.id, activeLotId, activeProjectId, route, workspaceReload]);

  const logout = () => {
    sessionStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setAccessToken(null);
    setUser(null);
    setLots([]);
    setProjects([]);
    setActiveLotId('');
    setActiveProjectId('');
    setWorkspaceReady(false);
    setCurrentView('diagnostico');
    navigate('/');
  };

  if (route === '/') return <LandingPage navigate={navigate} />;
  if (route === '/login') return <LoginPage navigate={navigate} onLogin={login} onGoogleAuth={startGoogleAuth} sessionError={authError} />;
  if (route === '/register') return <RegisterPage navigate={navigate} onRegister={register} onGoogleAuth={startGoogleAuth} />;
  if (route === '/auth/callback') return <main className="flex min-h-screen items-center justify-center bg-surface p-6"><section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="font-epilogue text-2xl font-bold text-primary">Acceso con Google</h1><p role={googleCallbackError ? 'alert' : 'status'} className={`mt-3 text-sm ${googleCallbackError ? 'text-error' : 'text-on-surface-variant'}`}>{googleCallbackError || (googleCallbackLoading ? 'Verificando tu cuenta…' : 'Preparando tu sesión…')}</p>{googleCallbackError && <button type="button" onClick={() => navigate('/login')} className="mt-5 rounded-full bg-primary-container px-5 py-3 text-sm font-bold text-white">Volver al inicio de sesión</button>}</section></main>;
  if (!authReady) return <main className="min-h-screen bg-surface p-8 text-center text-sm text-on-surface-variant">Verificando sesión…</main>;
  if (!user) return <main className="min-h-screen bg-surface p-8 text-center text-sm text-on-surface-variant">Redirigiendo al acceso…</main>;
  if (route.startsWith('/app') && !workspaceReady) return <main className="min-h-screen bg-surface p-8 text-center text-sm text-on-surface-variant">Cargando tus predios y proyectos…</main>;
  if (route.startsWith('/app') && workspaceError && lots.length === 0) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-8 text-center"><p role="alert" className="max-w-lg rounded-xl border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">No fue posible cargar tus espacios de trabajo: {workspaceError}</p><button type="button" onClick={() => setWorkspaceReload((value) => value + 1)} className="rounded-full bg-primary-container px-5 py-3 text-sm font-bold text-white">Intentar de nuevo</button><button type="button" onClick={logout} className="text-sm font-semibold text-secondary underline">Cerrar sesión</button></main>;
  if (route === '/app/setup' || (route === '/app' && lots.length === 0)) return (
    <div className="min-h-screen bg-surface px-4 py-6 sm:px-8">
      <header className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
        <span className="font-epilogue text-xl font-bold text-primary">Reforesta · Mi espacio</span>
        <button type="button" onClick={logout} className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant">Salir</button>
      </header>
      <WorkspaceSetupView
        existingLots={lots}
        onCancel={lots.length ? () => navigate('/app') : undefined}
        onComplete={(lot, projectId) => {
          const lotId = idOf(lot);
          setLots((current) => [...current.filter((item) => idOf(item) !== lotId), lot]);
          setActiveLotId(lotId);
          setActiveProjectId(projectId ?? '');
          setWorkspaceError('');
          navigate('/app');
        }}
      />
    </div>
  );
  const activeLot = lots.find((lot) => idOf(lot) === activeLotId);
  const selectLot = (id: string) => {
    setActiveLotId(id);
    setActiveProjectId('');
    setSelectedSpeciesIds([]);
    setCurrentView('diagnostico');
    if (user) localStorage.setItem(`${ACTIVE_LOT_KEY}:${user.id ?? user.email}`, id);
  };
  const addCreatedProject = (project: ApiRecord) => {
    const projectId = idOf(project);
    setProjects((current) => [...current.filter((item) => idOf(item) !== projectId), project]);
    setActiveProjectId(projectId);
  };
  const selectProject = (id: string) => {
    setActiveProjectId(id);
    setSelectedSpeciesIds([]);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex w-full">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} lotName={String(activeLot?.nombre ?? activeLot?.nombre_lote ?? activeLotId)} />
      
      <div className="flex-1 flex flex-col md:ml-72 min-h-screen relative pb-16 md:pb-0 w-full">
        <TopBar userName={user.name} onLogout={logout} lots={lots} projects={projects} activeLotId={activeLotId} activeProjectId={activeProjectId} onLotChange={selectLot} onProjectChange={selectProject} onAddLot={() => navigate('/app/setup')} />
        <main key={activeLotId} className="flex-1 p-4 md:p-8 pt-20 md:pt-24 max-w-7xl mx-auto w-full">
          {workspaceError && <p role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{workspaceError}</p>}
          {currentView === 'diagnostico' && <DiagnosticoView setCurrentView={setCurrentView} lotId={activeLotId} />}
          {currentView === 'catalogo' && <CatalogoView setCurrentView={setCurrentView} setSelectedSpeciesId={setSelectedSpeciesId} selectedSpeciesIds={selectedSpeciesIds} setSelectedSpeciesIds={setSelectedSpeciesIds} lotId={activeLotId} />}
          {currentView === 'detalle' && <DetalleView setCurrentView={setCurrentView} selectedSpeciesId={selectedSpeciesId} lotId={activeLotId} />}
          {currentView === 'proyecto' && <ProyectoView selectedSpeciesIds={selectedSpeciesIds} lotId={activeLotId} selectedProjectId={activeProjectId} projects={projects} onProjectSelected={selectProject} onProjectCreated={addCreatedProject} />}
        </main>
        <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
      </div>
    </div>
  );
}
