import { ArrowRight, CheckCircle2, Droplets, Leaf, MapPin, Microscope, Sprout, Trees, Waves } from 'lucide-react';

type Props = {
  navigate: (path: string) => void;
};

const species = [
  {
    name: 'Guayacán Polvillo',
    scientific: 'Handroanthus chrysanthus',
    layer: 'Dosel Superior',
    image: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=700&h=480&fit=crop',
    benefit: 'Atracción de polinizadores',
  },
  {
    name: 'Aliso Andino',
    scientific: 'Alnus acuminata',
    layer: 'Pionera / Nodriza',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&h=480&fit=crop',
    benefit: 'Fijación de nitrógeno',
  },
  {
    name: 'Roble de Montaña',
    scientific: 'Quercus humboldtii',
    layer: 'Dosel Clímax',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=700&h=480&fit=crop',
    benefit: 'Refugio de fauna',
  },
  {
    name: 'Arrayán de Páramo',
    scientific: 'Myrcianthes leucoxyla',
    layer: 'Estrato Medio',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=700&h=480&fit=crop',
    benefit: 'Cosecha hídrica',
  },
];

const steps = [
  {
    title: 'Ingresa tu ubicación y microclima',
    description: 'Cruzamos topografía, gradientes térmicos y registros de precipitación para comprender las condiciones de tu terreno.',
    icon: MapPin,
    tag: 'Análisis geoespacial',
  },
  {
    title: 'Descubre especies nativas óptimas',
    description: 'Identificamos especies compatibles con tu suelo y clima para recuperar la biodiversidad del ecosistema.',
    icon: Leaf,
    tag: 'Compatibilidad ecológica',
  },
  {
    title: 'Planifica la siembra',
    description: 'Calcula cantidades, insumos y ventanas de siembra con recomendaciones para llevar tu proyecto a campo.',
    icon: Sprout,
    tag: 'Plan de restauración',
  },
];

export default function LandingPage({ navigate }: Props) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-30 border-b border-outline-variant/50 bg-surface/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-3 md:px-8">
          <a href="/" className="flex items-center gap-2 font-epilogue text-xl font-bold tracking-tight text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-secondary-container"><Trees size={20} /></span>
            Reforesta
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-on-surface-variant lg:flex">
            <a className="hover:text-primary" href="#diagnostico">Diagnóstico</a>
            <a className="hover:text-primary" href="#especies">Especies</a>
            <a className="hover:text-primary" href="#metodologia">Metodología</a>
            <a className="hover:text-primary" href="#impacto">Impacto</a>
            <a className="hover:text-primary" href="#testimonios">Testimonios</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="hidden rounded-full px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container sm:inline-flex">Iniciar sesión</button>
            <button onClick={() => navigate('/register')} className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary">
              Crear cuenta <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section id="diagnostico" className="bg-gradient-to-b from-surface to-surface-container-low px-4 py-12 md:px-8 md:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
                <Microscope size={15} className="text-secondary" /> Plataforma bio-regional · Algoritmo bioclimático
              </span>
              <h1 className="max-w-3xl font-epilogue text-4xl font-bold leading-tight tracking-tight text-primary md:text-5xl">
                Reforesta con sabiduría ecológica y precisión bioclimática
              </h1>
              <p className="max-w-2xl text-base leading-7 text-on-surface-variant md:text-lg">
                Diagnóstico avanzado de suelo, retención hídrica y microclima. Obtén recomendaciones de flora nativa y planes de restauración para fincas, predios y corredores biológicos.
              </p>
              <div className="max-w-2xl rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
                <label htmlFor="landing-location" className="mb-2 block text-xs font-bold text-on-surface">Ubicación del terreno o coordenadas GPS</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
                    <input id="landing-location" className="w-full rounded-xl border border-outline-variant bg-surface px-10 py-3 text-sm text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" placeholder="Ej. Cuenca Alta del Río Fonce" />
                  </div>
                  <button onClick={() => navigate('/register')} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-container px-5 py-3 text-sm font-bold text-white transition hover:bg-primary">
                    <Microscope size={17} /> Explorar mi terreno
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-on-surface-variant">
                  <span>● Suelos andinos</span><span>● Bosque seco tropical</span><span>● Cuencas hídricas</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-outline-variant bg-white p-4 shadow-lg">
                <div className="relative h-56 overflow-hidden rounded-xl md:h-64">
                  <img className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000&h=700&fit=crop" alt="Bosque nativo andino" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary"><CheckCircle2 size={14} /> Suelo compatible</span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-white">Elevación: 2,150 msnm</span>
                </div>
                <div className="space-y-4 p-2 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-epilogue text-lg font-bold text-primary">Vista previa del diagnóstico</h2>
                    <span className="text-sm font-bold text-secondary">Óptimo · 92/100</span>
                  </div>
                  {[
                    ['Humedad radicular', '74%', 'w-[74%]'],
                    ['Acidez del suelo (pH)', '6.1', 'w-[61%]'],
                    ['Incidencia solar', '5.8 h/día', 'w-[58%]'],
                  ].map(([label, value, width], index) => (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-xs font-semibold"><span>{label}</span><span>{value}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-container"><div className={`h-full rounded-full ${index === 1 ? 'bg-tertiary-container' : 'bg-secondary'} ${width}`} /></div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-outline-variant pt-3 text-xs">
                    <span className="text-on-surface-variant">Especie nodriza recomendada</span><strong className="text-primary">Aliso (Alnus acuminata)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="impacto" className="bg-surface-container-high px-4 py-12 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center">
              <span className="text-sm font-semibold text-secondary">Monitoreo satelital y de campo</span>
              <h2 className="font-epilogue text-2xl font-bold tracking-tight text-primary md:text-3xl">Impacto regenerativo acumulado</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Trees, value: '+450,000', title: 'Árboles nativos plantados', caption: 'Corredores forestales y parcelas protegidas' },
                { icon: Droplets, value: '1,200', title: 'Microcuencas restauradas', caption: 'Fuentes hídricas y recarga de acuíferos locales' },
                { icon: Sprout, value: '98%', title: 'Tasa de supervivencia', caption: 'Especies adaptadas a su suelo y microclima' },
              ].map(({ icon: Icon, value, title, caption }) => (
                <article key={title} className="rounded-2xl border border-outline-variant bg-white p-6 text-center shadow-sm">
                  <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-primary"><Icon size={20} /></span>
                  <p className="font-epilogue text-3xl font-bold text-primary">{value}</p>
                  <h3 className="mt-1 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">{caption}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="metodologia" className="px-4 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div><span className="text-sm font-semibold text-secondary">Metodología científica</span><h2 className="font-epilogue text-2xl font-bold text-primary md:text-3xl">Restauración guiada en cada paso</h2></div>
              <span className="text-sm text-on-surface-variant">Protocolos validados por botánicos y silvicultores</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(({ title, description, icon: Icon, tag }, index) => (
                <article key={title} className="flex flex-col justify-between rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
                  <div><span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container font-bold text-primary">{index + 1}</span><h3 className="font-epilogue text-lg font-bold text-primary">{title}</h3><p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p></div>
                  <div className="mt-6 flex items-center gap-2 border-t border-outline-variant pt-4 text-xs font-bold text-secondary"><Icon size={16} />{tag}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="especies" className="bg-surface-container-low px-4 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-3xl">
              <span className="text-sm font-semibold text-secondary">Germoplasma y flora regional</span>
              <h2 className="font-epilogue text-2xl font-bold text-primary md:text-3xl">Catálogo de especies insignia</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">Flora adaptada a gradientes andinos y tropicales para recuperar biodiversidad y fortalecer los ecosistemas locales.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {species.map((item) => (
                <article key={item.name} className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm transition hover:-translate-y-1">
                  <div className="relative h-44"><img className="h-full w-full object-cover" src={item.image} alt={item.name} /><span className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-primary">{item.layer}</span></div>
                  <div className="p-4">
                    <h3 className="font-epilogue font-bold text-primary">{item.name}</h3><p className="text-xs italic text-on-surface-variant">{item.scientific}</p>
                    <p className="mt-3 rounded-lg bg-surface-container px-3 py-2 text-xs font-semibold text-secondary">{item.benefit}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-7 text-center"><button onClick={() => navigate('/register')} className="inline-flex items-center gap-2 font-semibold text-primary hover:text-secondary">Explora el catálogo completo <ArrowRight size={16} /></button></div>
          </div>
        </section>

        <section className="px-4 py-12 md:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-primary-container p-7 text-white md:p-10">
            <div className="relative z-10 max-w-2xl">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Herramienta edafológica abierta</span>
              <h2 className="mt-4 font-epilogue text-2xl font-bold md:text-3xl">¿Tienes un predio, reserva o finca degradada?</h2>
              <p className="mt-3 leading-6 text-on-primary-container">Genera un informe bioclimático con capacidad de carga forestal y especies aptas para tu terreno.</p>
              <button onClick={() => navigate('/register')} className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary-container px-5 py-3 text-sm font-bold text-primary hover:bg-secondary-fixed">Comenzar diagnóstico predial <ArrowRight size={16} /></button>
            </div>
            <Trees className="absolute -bottom-8 -right-4 hidden h-64 w-64 text-white/10 md:block" />
          </div>
        </section>

        <section id="testimonios" className="bg-surface-container-high px-4 py-14 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center"><span className="text-sm font-semibold text-secondary">Comunidad de guardianes del bosque</span><h2 className="font-epilogue text-2xl font-bold text-primary md:text-3xl">Voces de nuestra red de custodios</h2></div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Carlos Restrepo', 'Finca La Floresta · Antioquia', '“El plan nos ayudó a recuperar la vegetación de nuestra cuenca con especies nativas adaptadas al terreno.”'],
                ['Dra. Marcela Varela', 'Bióloga de conservación', '“Una herramienta valiosa para diseñar corredores biológicos y restaurar ecosistemas diversos.”'],
                ['Santiago Ocampo', 'Reserva Natural Los Nogales', '“Ahora podemos planificar las jornadas y las especies con mejores datos sobre nuestro predio.”'],
              ].map(([name, role, quote]) => <figure key={name} className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm"><div className="text-amber-600">★★★★★</div><blockquote className="my-4 text-sm leading-6 text-on-surface-variant">{quote}</blockquote><figcaption className="border-t border-outline-variant pt-4"><strong className="block text-sm text-primary">{name}</strong><span className="text-xs text-on-surface-variant">{role}</span></figcaption></figure>)}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 md:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-outline-variant bg-white p-8 text-center shadow-sm md:p-10">
            <Waves className="mx-auto mb-3 text-secondary" size={25} />
            <h2 className="font-epilogue text-2xl font-bold text-primary">Sé parte de una red bio-regional de restauración</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">Devuélvele a la tierra su equilibrio natural. Empieza con el diagnóstico de tu predio y crea tu proyecto de restauración.</p>
            <button onClick={() => navigate('/register')} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-container px-5 py-3 text-sm font-bold text-white hover:bg-primary">Crear proyecto ahora <ArrowRight size={16} /></button>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-container-high px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-xs text-on-surface-variant md:flex-row md:text-left">
          <div><strong className="text-primary">Reforesta</strong><p>© 2026 Reforesta Bio-Regional Stewardship Platform.</p></div>
          <div className="flex flex-wrap justify-center gap-4"><a href="#impacto">Privacidad</a><a href="#metodologia">Marco ecológico</a><a href="#especies">Flora nativa</a><button onClick={() => navigate('/login')} className="hover:text-primary">Iniciar sesión</button></div>
        </div>
      </footer>
    </div>
  );
}
