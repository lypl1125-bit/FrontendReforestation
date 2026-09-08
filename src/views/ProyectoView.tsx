import { Map, Calendar, Users, Target, Activity, TreePine, Download, Share2, Play, CheckCircle2, ChevronRight, BarChart3, CloudRain } from 'lucide-react';

export default function ProyectoView() {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Proyecto: Valle Verde</h1>
          <p className="text-sm text-gray-500">Plan de reforestación Fase 1</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center">
            <Share2 className="w-4 h-4 mr-2" />
            Compartir
          </button>
          <button className="flex-1 md:flex-none px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 flex items-center justify-center">
            <Play className="w-4 h-4 mr-2" />
            Iniciar Fase
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <TreePine className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">4,500</h3>
            <p className="text-sm text-gray-500">Árboles a plantar</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Map className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">12.5 ha</h3>
            <p className="text-sm text-gray-500">Área total</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">85%</h3>
            <p className="text-sm text-gray-500">Tasa exp. de supervivencia</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">24</h3>
            <p className="text-sm text-gray-500">Voluntarios requeridos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content - Map and Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Map Preview */}
          <div className="bg-white rounded-3xl p-2 border border-gray-100 shadow-sm relative overflow-hidden h-80">
            {/* Fake Map Background */}
            <div className="absolute inset-0 bg-gray-100 rounded-2xl overflow-hidden">
               <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Map View" 
                className="w-full h-full object-cover opacity-60"
              />
              {/* Overlay graphics */}
              <div className="absolute inset-0 p-8 flex items-center justify-center">
                <div className="w-full max-w-sm h-full border-2 border-primary/50 bg-primary/10 rounded-3xl relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-[0_0_0_4px_rgba(34,197,94,0.3)] animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-sm border border-gray-100/50">
              <h4 className="font-bold text-gray-900 text-sm">Sector Norte</h4>
              <p className="text-xs text-gray-500">Parcela A1 - A4</p>
            </div>
          </div>

          {/* Timeline / Milestones */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 font-display flex items-center justify-between">
              Fases del Proyecto
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">Fase 2 Activa</span>
            </h3>

            <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
              
              <div className="relative pl-6">
                <div className="absolute w-4 h-4 bg-primary rounded-full -left-[9px] top-1 ring-4 ring-white" />
                <h4 className="font-bold text-gray-900 text-lg">Preparación del Terreno</h4>
                <p className="text-sm text-primary font-medium mb-2">Completado - 15 Oct</p>
                <p className="text-sm text-gray-600">Despeje de matorral invasivo y preparación de alcorques según el patrón de tresbolillo definido en el mapa.</p>
              </div>

              <div className="relative pl-6">
                <div className="absolute w-4 h-4 bg-white border-4 border-primary rounded-full -left-[9px] top-1 ring-4 ring-white" />
                <h4 className="font-bold text-gray-900 text-lg">Jornada de Plantación</h4>
                <p className="text-sm text-amber-600 font-medium mb-2">En progreso - 1 Nov</p>
                <p className="text-sm text-gray-600 mb-4">Plantación de 2,500 encinas y 2,000 pinos con apoyo de voluntarios locales.</p>
                
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progreso actual</span>
                    <span className="text-sm font-bold text-primary">45%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>

              <div className="relative pl-6">
                <div className="absolute w-4 h-4 bg-white border-4 border-gray-200 rounded-full -left-[9px] top-1 ring-4 ring-white" />
                <h4 className="font-bold text-gray-400 text-lg">Primer Riego de Asiento</h4>
                <p className="text-sm text-gray-400 font-medium mb-2">Programado - 5 Nov</p>
                <p className="text-sm text-gray-400">Riego profundo (20L por planta) para asegurar el contacto de las raíces con el suelo.</p>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column - Species Mix & Weather */}
        <div className="space-y-6">
          
          {/* Weather Widget */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-sm font-medium">Condiciones</p>
                <h3 className="text-2xl font-bold">18°C</h3>
              </div>
              <CloudRain className="w-8 h-8 text-blue-100" />
            </div>
            <p className="text-sm text-blue-50 leading-relaxed mb-4">
              Lluvia ligera pronosticada para mañana. Condiciones óptimas para la plantación.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <span className="block text-blue-200">Humedad</span>
                <span className="font-bold text-white">65%</span>
              </div>
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <span className="block text-blue-200">Viento</span>
                <span className="font-bold text-white">12 km/h</span>
              </div>
            </div>
          </div>

          {/* Species Composition */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Mix de Especies</h3>
              <button className="text-primary hover:text-primary/80 transition-colors">
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Encina (Quercus ilex)</span>
                  <span className="font-bold text-gray-900">55%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '55%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">2,475 uds.</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Pino Piñonero</span>
                  <span className="font-bold text-gray-900">30%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '30%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">1,350 uds.</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Almendro Silvestre</span>
                  <span className="font-bold text-gray-900">15%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: '15%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">675 uds.</p>
              </div>

            </div>
            
            <button className="w-full mt-6 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">
              Modificar Mix
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
