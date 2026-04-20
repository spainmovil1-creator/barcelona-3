import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { historyData } from '../data';
import { historyDataCa } from '../data_ca';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { ArrowRight, List } from 'lucide-react';

export default function Home() {
  const { language } = useLanguage();
  const currentData = language === 'ca' ? historyDataCa : historyData;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="relative w-full min-h-[100svh] aspect-[3/4] sm:aspect-[4/3] bg-stone-900 overflow-hidden">
        {/* Imagen para móvil (vertical) */}
        <img 
          src="/img/portada3vertical.jpg?v=16" 
          alt="Historia de Barcelona"
          className="absolute inset-0 w-full h-full object-cover object-top sm:hidden"
        />
        {/* Imagen para tablet (cuadrada 1:1) */}
        <img 
          src="/img/portada_tablet_cuadrada.jpg?v=2" 
          alt="Historia de Barcelona"
          className="absolute inset-0 w-full h-full object-cover object-top hidden sm:block lg:hidden"
        />
        {/* Imagen para ordenador (horizontal) */}
        <img 
          src="/img/portada1horizontal.jpg?v=16" 
          alt="Historia de Barcelona"
          className="absolute inset-0 w-full h-full object-cover object-top hidden lg:block"
        />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white drop-shadow-lg">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-0 sm:px-6 py-12 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {currentData.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#fff3c2]/40 backdrop-blur-sm sm:rounded-2xl shadow-sm border-y sm:border border-[#7a4900]/20 overflow-hidden flex flex-col"
            >
              <Link to={`/seccion/${section.id}`} className="group block relative aspect-square sm:aspect-[4/3] overflow-hidden shrink-0 bg-transparent">
                <img 
                  src={`/img/seccion${section.id}.jpg?v=2`} 
                  alt={section.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#fff3c2]/90 via-[#fff3c2]/30 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <h2 
                    className="text-2xl font-bold group-hover:text-[#7a4900]/80 transition-colors text-[#7a4900]"
                    style={{ fontFamily: 'var(--font-eb-garamond)' }}
                  >
                    {section.title}
                  </h2>
                </div>
              </Link>
              <div className="p-6 flex-1">
                <h3 className="text-sm font-bold text-[#7a4900] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <List className="w-4 h-4" /> {language === 'ca' ? 'Etapes' : 'Etapas'}
                </h3>
                <ul className="space-y-3">
                  {section.stages.map((stage) => (
                    <li key={stage.id}>
                      <Link 
                        to={`/seccion/${section.id}#${stage.id}`}
                        className="group flex items-start gap-3 text-[#111827]/80 hover:text-[#7a4900] transition-colors"
                      >
                        <span className="text-[#7a4900]/40 group-hover:text-[#7a4900] transition-colors mt-1 shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </span>
                        <span className="font-medium leading-snug text-[#111827]">
                          {stage.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
