import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Send, Loader2, Bot, Mic, MicOff } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Profile, Experience, Project, Skill, Education } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useLiveAPI } from '../hooks/useLiveAPI';

interface AIAssistantProps {
  userId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { t, language } = useLanguage();
  
  const [profileData, setProfileData] = useState<{
    profile: Profile | null;
    experiences: Experience[];
    projects: Project[];
    skills: Skill[];
    educations: Education[];
  }>({
    profile: null,
    experiences: [],
    projects: [],
    skills: [],
    educations: []
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileSnap = await getDoc(doc(db, 'profiles', userId));
        let profile = null;
        if (profileSnap.exists()) {
          profile = { id: profileSnap.id, ...profileSnap.data() } as unknown as Profile;
        }

        const expSnap = await getDocs(collection(db, `profiles/${userId}/experiences`));
        const experiences = expSnap.docs.map(d => ({ id: d.id, ...d.data() } as Experience)).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

        const projSnap = await getDocs(collection(db, `profiles/${userId}/projects`));
        const projects = projSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));

        const skillSnap = await getDocs(collection(db, `profiles/${userId}/skills`));
        const skills = skillSnap.docs.map(d => ({ id: d.id, ...d.data() } as Skill));

        const eduSnap = await getDocs(collection(db, `profiles/${userId}/educations`));
        const educations = eduSnap.docs.map(d => ({ id: d.id, ...d.data() } as Education)).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

        setProfileData({ profile, experiences, projects, skills, educations });
        
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: t('ai.greeting', { name: profile?.fullName || t('ai.fallback') })
          }
        ]);
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Error fetching data for AI Assistant:", error);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const apiKey = process.env.GEMINI_API_KEY || '';

  const getSystemInstruction = () => {
    const { profile, experiences, projects, skills, educations } = profileData;
    const context = `
      Eres el asistente virtual personal y exclusivo de ${profile?.fullName || 'este profesional'}.
      Tu objetivo es representar a ${profile?.fullName || 'esta persona'} de la mejor manera posible, respondiendo preguntas sobre su perfil profesional de forma amable, entusiasta, profesional y concisa.
      Debes presentarte como su asistente personal, dando una sensación de cercanía y exclusividad.
      Debes responder en el idioma: ${language === 'en' ? 'Inglés' : language === 'pt' ? 'Portugués' : language === 'fr' ? 'Francés' : 'Español'}.
      NO debes inventar información. Si te preguntan algo que no está en el contexto, di que no tienes esa información a mano pero que pueden contactar a ${profile?.fullName || 'esta persona'} directamente para más detalles.
      
      Aquí está la información detallada del perfil:
      Nombre: ${profile?.fullName || 'No especificado'}
      Título: ${profile?.title || 'No especificado'}
      Biografía: ${profile?.bio || 'No especificado'}
      Ubicación: ${profile?.location || 'No especificado'}
      
      Educación y Estudios:
      ${educations.map(edu => `- ${edu.degree} en ${edu.institution} (${edu.startDate} - ${edu.current ? 'Presente' : edu.endDate}). ${edu.fieldOfStudy ? `Área: ${edu.fieldOfStudy}.` : ''} ${edu.description || ''}`).join('\n')}

      Experiencia Laboral:
      ${experiences.map(exp => `- ${exp.role} en ${exp.company} (${exp.startDate} - ${exp.current ? 'Presente' : exp.endDate}). ${exp.description || ''}`).join('\n')}
      
      Proyectos:
      ${projects.map(proj => `- ${proj.name}: ${proj.description}. Rol: ${proj.role || 'N/A'}`).join('\n')}
      
      Habilidades:
      ${skills.map(skill => `- ${skill.name} (${skill.category})`).join('\n')}
    `;
    return context;
  };

  const { isLive, isConnecting, startLiveAPI, stopLiveAPI, error: liveError } = useLiveAPI({
    apiKey,
    systemInstruction: getSystemInstruction(),
    voiceName: profileData.profile?.aiVoice || 'Zephyr',
    onMessage: (msg) => {
      console.log("Live API Message:", msg);
      
      // Handle model output transcription
      const modelTurn = msg.serverContent?.modelTurn;
      if (modelTurn) {
        const textPart = modelTurn.parts?.find(p => p.text);
        if (textPart && textPart.text) {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            // If the last message is from the assistant and it's a "live" message (we can tag it or just assume if it's the last one after a user message)
            // Actually, let's just append if the last message is assistant AND it's not the initial greeting
            if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id !== '1') {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { ...lastMsg, content: lastMsg.content + textPart.text };
              return newMessages;
            } else {
              return [...prev, { id: Date.now().toString(), role: 'assistant', content: textPart.text! }];
            }
          });
        }
      }

      // Handle user input transcription (if available in the message)
      // The exact field depends on the API, but usually it's in a different field like clientContent or similar
      // We will log it to see where it comes from
    }
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isDataLoaded) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const currentApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
      if (!currentApiKey) {
        throw new Error("API Key not found in environment");
      }
      
      const ai = new GoogleGenAI({ apiKey: currentApiKey });
      
      const chatHistory = messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');
      
      const prompt = `
        Contexto del profesional:
        ${getSystemInstruction()}
        
        Historial de chat:
        ${chatHistory}
        
        Usuario: ${userMessage}
        Asistente:
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
      });

      const assistantMessage = response.text || 'Lo siento, no pude procesar tu solicitud.';
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: t('ai.error') + ` (${errorMessage})`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profileData.profile?.isPremium) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 md:bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label={t('ai.open')}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 md:bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-[350px] h-[500px] max-h-[70vh] md:max-h-[80vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 z-50 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 bg-indigo-600 rounded-t-2xl text-white">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <h3 className="font-medium">{t('ai.title')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={isLive ? stopLiveAPI : startLiveAPI}
              disabled={isConnecting}
              className={`p-1.5 rounded-lg transition-colors ${isLive ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-white/20'} ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isLive ? "Stop Voice" : "Start Voice"}
            >
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : isLive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live API Status Banner */}
        {isLive && (
          <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 flex items-center justify-center gap-2 border-b border-indigo-100 dark:border-indigo-800">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Listening... Speak now</span>
          </div>
        )}
        {liveError && (
          <div className="bg-red-50 dark:bg-red-900/30 px-4 py-3 flex flex-col items-center justify-center gap-2 border-b border-red-100 dark:border-red-800">
            <span className="text-xs font-medium text-red-700 dark:text-red-300 text-center">{liveError}</span>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 px-3 py-1.5 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Recargar página
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950/50">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl rounded-bl-sm shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-2xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              disabled={isLoading || isLive}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isLive}
              className="absolute right-2 p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
