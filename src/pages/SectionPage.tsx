import { useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { historyData } from '../data';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, MapPin, Home } from 'lucide-react';
import Markdown from 'react-markdown';

export default function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const location = useLocation();
  const section = historyData.find(s => s.id === sectionId);
  const stageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const allStages = historyData.flatMap(s => s.stages.map(st => ({ ...st, sectionId: s.id })));

  useEffect(() => {
    if (location.hash && stageRefs.current[location.hash.substring(1)]) {
      setTimeout(() => {
        stageRefs.current[location.hash.substring(1)]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.hash, sectionId]);

  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Sección no encontrada</h1>
          <Link to="/" className="text-blue-600 hover:underline flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-[#fff3c2]/80 backdrop-blur-md text-[#111827] py-4 px-6 sticky top-0 z-40 shadow-sm overflow-hidden border-b border-[#7a4900]/20">
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center" 
          style={{ backgroundImage: `url('/img/seccion${section.id}.jpg?v=2')` }}
        />
        <div className="relative z-10 max-w-5xl mx-auto flex items-center justify-between gap-4">
          <h1 
            className="text-lg md:text-xl font-bold tracking-tight truncate text-[#7a4900]"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            {section.title}
          </h1>
          <Link 
            to="/" 
            onClick={() => window.scrollTo(0, 0)}
            className="text-[#7a4900] hover:text-[#111827] transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap bg-[#fff3c2]/80 border border-[#7a4900]/20 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            <Home className="w-4 h-4" /> <span className="hidden sm:inline">Índice Principal</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-0 sm:px-6 py-8 sm:py-12">
        <div className="space-y-12 sm:space-y-24">
          {section.stages.map((stage, index) => {
            const globalIndex = allStages.findIndex(s => s.id === stage.id);
            const prevStage = globalIndex > 0 ? allStages[globalIndex - 1] : null;
            const nextStage = globalIndex < allStages.length - 1 ? allStages[globalIndex + 1] : null;

            return (
              <motion.div
                key={stage.id}
                id={stage.id}
                ref={el => stageRefs.current[stage.id] = el}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="scroll-mt-24"
              >
                <div className="bg-[#fff3c2]/40 backdrop-blur-sm sm:rounded-3xl shadow-sm border-y sm:border border-[#7a4900]/20 overflow-hidden flex flex-col">
                <div className="group w-full relative aspect-square sm:aspect-[4/3] overflow-hidden shrink-0 bg-transparent">
                  <img
                    src={`${stage.image}?v=2`}
                    alt={stage.title}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#fff3c2]/90 via-[#fff3c2]/30 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 p-8 w-full">
                    <div className="flex items-center gap-2 text-[#7a4900]/80 mb-3 font-medium tracking-wide uppercase text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{stage.id === 'etapa-final' ? 'Conclusión' : `Etapa ${index + 1}`}</span>
                    </div>
                    <h2 
                      className="text-3xl md:text-4xl font-bold leading-tight text-[#7a4900]"
                      style={{ fontFamily: 'var(--font-eb-garamond)' }}
                    >
                      {stage.title}
                    </h2>
                  </div>
                </div>
                <div className="p-8 md:p-12 flex-1">
                    <p className="text-xl leading-relaxed text-[#111827]/80 mb-8 font-medium">
                      {stage.description}
                    </p>
                    <div className="prose prose-lg max-w-none prose-headings:text-[#7a4900] prose-headings:font-bold prose-p:text-[#111827] prose-strong:text-[#111827] prose-li:text-[#111827] prose-a:text-[#7a4900]">
                      <Markdown>{stage.content}</Markdown>
                    </div>
                  </div>
                  
                  <div className="bg-[#fff3c2]/40 p-6 border-t border-[#7a4900]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {prevStage ? (
                      <Link 
                        to={`/seccion/${prevStage.sectionId}#${prevStage.id}`}
                        className="flex items-center gap-2 text-[#7a4900]/80 hover:text-[#7a4900] font-medium transition-colors w-full sm:w-auto justify-center sm:justify-start"
                      >
                        <ArrowLeft className="w-4 h-4" /> 
                        <span className="truncate max-w-[200px]">Anterior</span>
                      </Link>
                    ) : <div className="hidden sm:block w-[100px]" />}
                    
                    <Link 
                      to="/"
                      onClick={() => window.scrollTo(0, 0)}
                      className="flex items-center gap-2 text-[#7a4900]/60 hover:text-[#7a4900] font-medium transition-colors w-full sm:w-auto justify-center"
                    >
                      <Home className="w-4 h-4" /> Índice
                    </Link>

                    {nextStage ? (
                      <Link 
                        to={`/seccion/${nextStage.sectionId}#${nextStage.id}`}
                        className="flex items-center gap-2 text-[#7a4900]/80 hover:text-[#7a4900] font-medium transition-colors w-full sm:w-auto justify-center sm:justify-end"
                      >
                        <span className="truncate max-w-[200px]">Siguiente</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : <div className="hidden sm:block w-[100px]" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
