import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Trees, Users } from 'lucide-react';
import { apiOptions } from '../services/api';

type Props = {
  navigate: (path: string) => void;
};

type LoginProps = Props & {
  onLogin: (email: string, password: string, remember: boolean) => Promise<void>;
  sessionError?: string;
};

type RegisterProps = Props & {
  onRegister: (fullName: string, email: string, password: string) => Promise<boolean>;
};

const fieldClass = 'w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none transition focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20';

function BrandLink({ navigate }: { navigate: (path: string) => void }) {
  return <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 font-epilogue text-xl font-bold tracking-tight text-primary">
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-secondary-container"><Trees size={20} /></span>Reforesta
  </button>;
}

function StoryPanel({ registration = false }: { registration?: boolean }) {
  return (
    <aside className="relative hidden min-h-[720px] flex-col justify-between overflow-hidden bg-primary p-8 text-white lg:flex xl:p-12">
      <img className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-screen" src={registration ? 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=1500&fit=crop' : 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&h=1500&fit=crop'} alt="" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/85 to-primary" />
      <div className="relative z-10 flex items-center justify-between">
        <BrandLink navigate={(path) => { window.location.assign(path); }} />
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-secondary-container">Red Bio-Regional</span>
      </div>
      <div className="relative z-10 my-10 max-w-xl">
        <div className="mb-5 h-1 w-12 rounded-full bg-secondary-container" />
        <blockquote className="font-epilogue text-3xl font-bold leading-tight">
          {registration ? 'Siembra con respaldo científico y adaptabilidad climática.' : 'Cada árbol sembrado en el suelo correcto es un legado para las futuras generaciones.'}
        </blockquote>
        <p className="mt-5 max-w-lg text-sm leading-6 text-white/70">
          Plataforma bio-regional para el diagnóstico de microclima, análisis de suelos y regeneración forestal comunitaria.
        </p>
        {registration && <div className="relative mt-8 h-56 overflow-hidden rounded-2xl border border-white/20">
          <img className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&h=600&fit=crop" alt="Vivero y paisaje de restauración forestal" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
          <span className="absolute bottom-4 left-4 text-xs font-semibold">Corredor Biológico Andino Central</span>
        </div>}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/10 p-4"><p className="text-xs text-white/60">Árboles nativos</p><p className="mt-1 font-epilogue text-2xl font-bold">+450k</p><p className="text-xs text-white/60">plantados</p></div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-4"><p className="text-xs text-white/60">Retención hídrica</p><p className="mt-1 font-epilogue text-2xl font-bold">94.8%</p><p className="text-xs text-white/60">tasa de supervivencia</p></div>
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-3 border-t border-white/15 pt-5 text-xs text-white/65">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-bold text-white">CL</span>
        Respaldado por más de <strong className="text-white">1,850 custodios</strong> de cuencas en Latinoamérica.
      </div>
    </aside>
  );
}

function AuthLayout({ children, navigate, registration = false }: Pick<Props, 'navigate'> & { children: ReactNode; registration?: boolean }) {
  return (
    <div className="min-h-screen bg-white text-on-surface">
      {registration && <header className="sticky top-0 z-30 border-b border-outline-variant/50 bg-white/90 px-4 py-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between"><BrandLink navigate={navigate} /><div className="flex items-center gap-3"><span className="hidden text-sm text-on-surface-variant sm:inline">¿Ya tienes cuenta?</span><button onClick={() => navigate('/login')} className="rounded-full border border-primary-container px-4 py-2 text-sm font-semibold text-primary transition hover:bg-surface-container">Iniciar sesión</button></div></div>
      </header>}
      <main className="grid min-h-screen lg:grid-cols-2">
        <StoryPanel registration={registration} />
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-xl">
            {!registration && <div className="mb-10 flex items-center justify-between lg:hidden"><BrandLink navigate={navigate} /><span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-secondary">Red Bio-Regional</span></div>}
            {children}
          </div>
        </section>
      </main>
      <footer className="border-t border-outline-variant/40 bg-surface-container-high px-5 py-4 text-center text-xs text-on-surface-variant">
        © 2026 Reforesta Bio-Regional Stewardship Platform. <span className="mx-2 hidden sm:inline">·</span><a className="hover:text-primary" href="/">Inicio</a>
      </footer>
    </div>
  );
}

export function LoginPage({ navigate, onLogin, sessionError = '' }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Ingresa tu correo electrónico y contraseña para continuar.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onLogin(email.trim(), password, remember);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No fue posible iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout navigate={navigate}>
      <div className="mb-7">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-bold text-secondary"><span className="h-2 w-2 rounded-full bg-secondary" />Portal de Custodios & Propietarios</span>
        <h1 className="font-epilogue text-3xl font-bold tracking-tight text-primary md:text-4xl">Bienvenido de vuelta</h1>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">Ingresa a tu cuenta para gestionar tus proyectos de siembra y predios.</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <button type="button" disabled title="Disponible próximamente" className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-3 py-3 text-sm font-semibold text-on-surface-variant opacity-70">🌐 Google <span className="text-[10px]">próximamente</span></button>
        <button type="button" disabled title="Disponible próximamente" className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-3 py-3 text-sm font-semibold text-on-surface-variant opacity-70">● Apple <span className="text-[10px]">próximamente</span></button>
      </div>
      <div className="relative mb-5 text-center"><div className="border-t border-outline-variant/60" /><span className="relative -top-3 bg-white px-3 text-xs text-outline">o continúa con correo electrónico</span></div>

      <form className="space-y-4" onSubmit={submit}>
        <label className="block space-y-1.5"><span className="text-sm font-semibold">Correo electrónico</span><span className="relative block"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} /><input className={`${fieldClass} pl-10`} type="email" autoComplete="email" placeholder="ejemplo@reforesta.org" value={email} onChange={(event) => setEmail(event.target.value)} required /></span></label>
        <label className="block space-y-1.5"><span className="flex items-center justify-between text-sm font-semibold">Contraseña <button type="button" onClick={() => setError('La recuperación de contraseña estará disponible cuando conectemos el servicio de autenticación.')} className="text-xs font-bold text-secondary hover:underline">¿Olvidaste tu contraseña?</button></span><span className="relative block"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} /><input className={`${fieldClass} pl-10 pr-12`} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresa tu contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
        <label className="flex items-center gap-2 text-sm text-on-surface-variant"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="rounded border-outline-variant text-primary focus:ring-secondary" /> Recordar mi sesión</label>
        {sessionError && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{sessionError}</p>}
        {error && <p role="alert" className="rounded-xl border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{error}</p>}
        <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-container px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-primary disabled:cursor-wait disabled:opacity-60">{submitting ? 'Validando…' : 'Iniciar sesión'} {!submitting && <ArrowRight size={17} />}</button>
      </form>

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-outline-variant/30 bg-surface p-3 text-xs leading-5 text-on-surface-variant"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-secondary" />{apiOptions.dataSource === 'api' ? 'La API valida tus credenciales y protege las solicitudes con tu sesión.' : 'Acceso de demostración: acepta cualquier correo válido y contraseña no vacía.'}</div>
      <div className="mt-6 border-t border-outline-variant/50 pt-5 text-center text-sm text-on-surface-variant">¿Aún no tienes cuenta? <button onClick={() => navigate('/register')} className="font-bold text-secondary underline">Regístrate gratis</button></div>
    </AuthLayout>
  );
}

export function RegisterPage({ navigate, onRegister }: RegisterProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const strength = [password.length >= 8, /[A-Z]/.test(password) && /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const strengthLabel = password.length === 0 ? 'Pendiente' : ['Débil', 'Básica', 'Buena', 'Fuerte', 'Muy fuerte'][strength];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const fullName = `${String(formData.get('firstName'))} ${String(formData.get('lastName'))}`.trim();
      const authenticated = await onRegister(fullName, String(formData.get('email')).trim(), password);
      if (!authenticated) {
        setNotice('Cuenta creada. Si la API requiere confirmar tu correo, hazlo antes de iniciar sesión.');
      }
    } catch (registrationError) {
      setError(registrationError instanceof Error ? registrationError.message : 'No fue posible crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout navigate={navigate} registration>
      <div className="mb-5">
        <span className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary"><Users size={15} /> Nuevo custodio forestal</span>
        <h1 className="font-epilogue text-3xl font-bold tracking-tight text-primary md:text-4xl">Únete a la Red de Reforestación</h1>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">Comienza a regenerar tus predios con especies nativas adaptadas a tu bioma.</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button type="button" disabled title="Disponible próximamente" className="rounded-full border border-outline-variant px-3 py-2.5 text-xs font-semibold text-on-surface-variant opacity-70">🌐 Registrarse con Google</button>
        <button type="button" disabled title="Disponible próximamente" className="rounded-full border border-outline-variant px-3 py-2.5 text-xs font-semibold text-on-surface-variant opacity-70">● Registrarse con Apple</button>
      </div>
      <div className="relative mb-4 text-center"><div className="border-t border-outline-variant/60" /><span className="relative -top-3 bg-white px-3 text-xs text-outline">o completa tus datos</span></div>

      <form className="space-y-3.5" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1"><span className="text-xs font-semibold">Nombre(s) *</span><input className={fieldClass} name="firstName" placeholder="Ej. Mateo" autoComplete="given-name" required /></label>
          <label className="space-y-1"><span className="text-xs font-semibold">Apellidos *</span><input className={fieldClass} name="lastName" placeholder="Ej. Arboleda Serna" autoComplete="family-name" required /></label>
        </div>
        <label className="block space-y-1"><span className="text-xs font-semibold">Correo electrónico *</span><span className="relative block"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={17} /><input className={`${fieldClass} pl-10`} name="email" type="email" autoComplete="email" placeholder="custodio@reforesta.org" required /></span></label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1"><span className="text-xs font-semibold">Contraseña *</span><span className="relative block"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} /><input className={`${fieldClass} pl-10 pr-10`} name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline" aria-label="Mostrar u ocultar contraseña">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
          <label className="block space-y-1"><span className="text-xs font-semibold">Confirmar contraseña *</span><input className={fieldClass} name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Repite la contraseña" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
        </div>
        <div className="rounded-lg border border-outline-variant/50 bg-surface-bright p-2.5">
          <div className="mb-1 flex justify-between text-[10px]"><span className="inline-flex items-center gap-1 font-semibold text-on-surface-variant"><LockKeyhole size={12} /> Fuerza de seguridad</span><span>{strengthLabel}</span></div>
          <div className="grid grid-cols-4 gap-1">{[0, 1, 2, 3].map((item) => <span key={item} className={`h-1 rounded-full ${item < strength ? strength > 2 ? 'bg-secondary' : 'bg-amber-500' : 'bg-outline-variant/50'}`} />)}</div>
        </div>
        <label className="flex items-start gap-2 text-xs leading-5 text-on-surface-variant"><input className="mt-1 rounded border-outline-variant text-primary focus:ring-secondary" type="checkbox" required /><span>Acepto los <a href="#terms" className="font-semibold text-secondary underline">Términos de Conservación</a> y la Política de Privacidad.</span></label>
        {notice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">{notice} <button type="button" onClick={() => navigate('/login')} className="font-bold underline">Ir al inicio de sesión</button></p>}
        {error && <p role="alert" className="rounded-xl border border-error/30 bg-error-container/40 px-4 py-2.5 text-sm text-on-error-container">{error}</p>}
        <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-container px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-primary disabled:cursor-wait disabled:opacity-60">{submitting ? 'Creando cuenta…' : 'Crear cuenta gratuita'} {!submitting && <ArrowRight size={17} />}</button>
      </form>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-outline-variant/30 bg-surface p-3 text-xs leading-5 text-on-surface-variant"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-secondary" />{apiOptions.dataSource === 'api' ? 'La cuenta se registra en la API con tu nombre, correo y contraseña.' : 'Registro de demostración: no se crea una cuenta en el backend.'}</div>
      <div className="mt-5 border-t border-outline-variant/50 pt-4 text-center text-sm text-on-surface-variant">¿Ya tienes una cuenta? <button onClick={() => navigate('/login')} className="font-bold text-secondary underline">Inicia sesión aquí</button></div>
    </AuthLayout>
  );
}
