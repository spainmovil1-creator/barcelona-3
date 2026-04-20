import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 bg-[#fff3c2]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#7a4900]/30 shadow-md">
      <button 
        onClick={() => setLanguage('es')}
        className={`text-xs font-bold transition-colors ${language === 'es' ? 'text-[#7a4900]' : 'text-[#7a4900]/40 hover:text-[#7a4900]/70'}`}
      >
        ES
      </button>
      <span className="text-[#7a4900]/20 text-xs font-light">|</span>
      <button 
        onClick={() => setLanguage('ca')}
        className={`text-xs font-bold transition-colors ${language === 'ca' ? 'text-[#7a4900]' : 'text-[#7a4900]/40 hover:text-[#7a4900]/70'}`}
      >
        CA
      </button>
    </div>
  );
}
