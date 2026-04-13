/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SectionPage from './pages/SectionPage';
import VoiceAssistant from './components/VoiceAssistant';

export default function App() {
  return (
    <Router>
      <div 
        className="relative min-h-screen antialiased selection:bg-[#7a4900] selection:text-[#fff3c2] bg-white"
        style={{ color: '#111827', fontFamily: 'var(--font-garamond)' }}
      >
        <div className="fixed inset-0 bg-[#fff3c2]/40 pointer-events-none z-0" />
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/seccion/:sectionId" element={<SectionPage />} />
          </Routes>
          <VoiceAssistant />
        </div>
      </div>
    </Router>
  );
}
