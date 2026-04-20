import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { historyData } from '../data';
import { historyDataCa } from '../data_ca';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useLanguage } from '../contexts/LanguageContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

const showStageOnScreen: FunctionDeclaration = {
  name: "showStageOnScreen",
  description: "Navega a una sección y etapa específica de la historia de Barcelona para mostrarla en pantalla. DEBES llamar a esta función ANTES de hablar sobre una etapa.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      stageName: {
        type: Type.STRING,
        description: "El nombre de la etapa que se va a mostrar."
      },
      sectionId: {
        type: Type.STRING,
        description: "El ID de la sección (ej. '1', '2', '3', '4', '5', '6')."
      },
      stageId: {
        type: Type.STRING,
        description: "El ID de la etapa (ej. 'etapa-1', 'etapa-2')."
      }
    },
    required: ["stageName", "sectionId", "stageId"]
  }
};

export default function VoiceAssistant() {
  const { language } = useLanguage();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const navigate = useNavigate();

  const connect = async () => {
    try {
      setErrorMsg(null);
      setIsConnecting(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      streamRef.current = stream;
      
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      nextPlayTimeRef.current = audioContext.currentTime;
      
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(audioContext.destination);

      const currentData = language === 'ca' ? historyDataCa : historyData;
      const systemInstruction = `Eres un guía turístico experto en la Historia de Barcelona.
Tu objetivo es acompañar al usuario a través de las diferentes etapas históricas de la ciudad.
Tienes acceso a una herramienta llamada 'showStageOnScreen'.
REGLA ESTRICTA: ANTES de empezar a hablar o explicar cualquier detalle sobre una etapa específica, DEBES llamar a la función 'showStageOnScreen' con el sectionId y stageId correspondientes para que la pantalla del usuario se mueva a esa etapa.
El usuario ha seleccionado el idioma: ${language === 'ca' ? 'CATALÁN. DEBES PROPORCIONAR TODA TU RESPUESTA HABLADA ESTRICTAMENTE EN CATALÁN.' : 'ESPAÑOL. DEBES PROPORCIONAR TODA TU RESPUESTA HABLADA EN ESPAÑOL.'}
Aquí tienes el contexto de las secciones y etapas disponibles:
${JSON.stringify(currentData.map(s => ({ id: s.id, title: s.title, stages: s.stages.map(st => ({ id: st.id, title: st.title })) })), null, 2)}
Sé amable, entusiasta y conciso en tus explicaciones.`;

      const ai = getAI();
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                let s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              const buffer = new ArrayBuffer(pcm16.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcm16.length; i++) {
                view.setInt16(i * 2, pcm16[i], true);
              }
              
              // Convert ArrayBuffer to base64 safely
              let binary = '';
              const bytes = new Uint8Array(buffer);
              const len = bytes.byteLength;
              for (let i = 0; i < len; i++) {
                  binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              activeSourcesRef.current = [];
              if (audioContextRef.current) {
                nextPlayTimeRef.current = audioContextRef.current.currentTime;
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const binary = atob(base64Audio);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              const pcm16 = new Int16Array(bytes.buffer);
              const audioBuffer = audioContextRef.current.createBuffer(1, pcm16.length, 24000);
              const channelData = audioBuffer.getChannelData(0);
              for (let i = 0; i < pcm16.length; i++) {
                channelData[i] = pcm16[i] / 32768.0;
              }
              const sourceNode = audioContextRef.current.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(audioContextRef.current.destination);
              
              const currentTime = audioContextRef.current.currentTime;
              if (nextPlayTimeRef.current < currentTime) {
                nextPlayTimeRef.current = currentTime;
              }
              sourceNode.start(nextPlayTimeRef.current);
              activeSourcesRef.current.push(sourceNode);
              
              sourceNode.onended = () => {
                activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== sourceNode);
              };
              
              nextPlayTimeRef.current += audioBuffer.duration;
            }

            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls) {
                const responses = functionCalls.map(call => {
                  if (call.name === 'showStageOnScreen') {
                    const args = call.args as any;
                    if (args.sectionId && args.stageId) {
                      navigate(`/seccion/${args.sectionId}#${args.stageId}`);
                    }
                    return {
                      id: call.id,
                      name: call.name,
                      response: { result: "success" }
                    };
                  }
                  return { id: call.id, name: call.name, response: { error: "unknown function" } };
                });
                sessionPromise.then(session => {
                  session.sendToolResponse({ functionResponses: responses });
                });
              }
            }
          },
          onclose: () => {
            disconnect();
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction,
          tools: [{ functionDeclarations: [showStageOnScreen] }]
        },
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (error: any) {
      console.error("Failed to connect:", error);
      if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
        setErrorMsg(language === 'ca' ? "Accés al micròfon denegat. Si us plau, permet l'accés al teu navegador." : "Acceso al micrófono denegado. Por favor, permite el acceso en tu navegador.");
      } else if (error.message.includes('GEMINI_API_KEY')) {
        setErrorMsg(language === 'ca' ? "Falta la clau API de Gemini. Configura-la en els ajustaments." : "Falta la API Key de Gemini. Por favor, configúrala en los ajustes.");
      } else {
        setErrorMsg(language === 'ca' ? "Error en connectar. Revisa la connexió o permisos." : "Error al conectar. Revisa tu conexión o permisos.");
      }
      setIsConnecting(false);
      disconnect();
    }
  };

  const disconnect = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {errorMsg && (
        <div className="bg-red-100 text-red-800 px-4 py-3 rounded-xl shadow-lg border border-red-200 text-sm font-medium max-w-xs text-right animate-in fade-in slide-in-from-bottom-4">
          {errorMsg}
          <button 
            onClick={() => setErrorMsg(null)}
            className="block mt-2 text-xs underline hover:text-red-900"
          >
            {language === 'ca' ? 'Tancar' : 'Cerrar'}
          </button>
        </div>
      )}
      {isConnected && (
        <div className="bg-[#fff3c2]/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-[#7a4900]/20 text-sm font-medium text-[#7a4900] animate-in fade-in slide-in-from-bottom-4">
          {language === 'ca' ? 'Assistent escoltant...' : 'Asistente escuchando...'}
        </div>
      )}
      <button
        onClick={isConnected ? disconnect : connect}
        disabled={isConnecting}
        className={cn(
          "h-16 w-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95",
          isConnected 
            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
            : "bg-[#7a4900] hover:bg-[#5c3700] text-[#fff3c2]",
          isConnecting && "opacity-80 cursor-not-allowed"
        )}
      >
        {isConnecting ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : isConnected ? (
          <Square className="w-6 h-6 fill-current" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </button>
    </div>
  );
}
