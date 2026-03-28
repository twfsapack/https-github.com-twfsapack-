import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Send, Loader2, Bot } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Profile, Experience, Project, Skill } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

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
  }>({
    profile: null,
    experiences: [],
    projects: [],
    skills: []
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
        const experiences = expSnap.docs.map(d => ({ id: d.id, ...d.data() } as Experience));

        const projSnap = await getDocs(collection(db, `profiles/${userId}/projects`));
        const projects = projSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));

        const skillSnap = await getDocs(collection(db, `profiles/${userId}/skills`));
        const skills = skillSnap.docs.map(d => ({ id: d.id, ...d.data() } as Skill));

        setProfileData({ profile, experiences, projects, skills });
        
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isDataLoaded) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);

    // In AI Studio, the Gemini API key is automatically injected into process.env.GEMINI_API_KEY
    // We shouldn't rely on VITE_GEMINI_API_KEY as it might be a placeholder or invalid
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    try {
      console.log("API Key present:", !!apiKey);
      if (!apiKey) {
        throw new Error("API Key not found in environment");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const { profile, experiences, projects, skills } = profileData;
      
      const context = `
        Eres el asistente virtual personal de ${profile?.fullName || 'este profesional'}.
        Tu objetivo es responder preguntas sobre su perfil profesional de forma amable, profesional y concisa.
        Debes responder en el idioma: ${language === 'en' ? 'Inglés' : language === 'pt' ? 'Portugués' : language === 'fr' ? 'Francés' : 'Español'}.
        NO debes inventar información. Si te preguntan algo que no está en el contexto, di que no tienes esa información pero que pueden contactar a ${profile?.fullName || 'esta persona'} directamente.
        
        Aquí está la información del perfil:
        Nombre: ${profile?.fullName || 'No especificado'}
        Título: ${profile?.title || 'No especificado'}
        Biografía: ${profile?.bio || 'No especificado'}
        Ubicación: ${profile?.location || 'No especificado'}
        
        Experiencia Laboral:
        ${experiences.map(exp => `- ${exp.role} en ${exp.company} (${exp.startDate} - ${exp.current ? 'Presente' : exp.endDate}). ${exp.description || ''}`).join('\n')}
        
        Proyectos:
        ${projects.map(proj => `- ${proj.name}: ${proj.description}. Rol: ${proj.role || 'N/A'}`).join('\n')}
        
        Habilidades:
        ${skills.map(skill => `- ${skill.name} (${skill.category})`).join('\n')}
      `;

      // Combine previous messages for context
      const chatHistory = messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');
      
      const prompt = `
        Contexto del profesional:
        ${context}
        
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
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      const apiKeyStatus = apiKey ? `Key length: ${apiKey.length}` : 'Key missing';
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: t('ai.error') + ` (${errorMessage} | ${apiKeyStatus})`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  console.log("AIAssistant render state:", { isPremium: profileData.profile?.isPremium, isDataLoaded });

  if (!profileData.profile?.isPremium) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label={t('ai.open')}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-[350px] h-[500px] max-h-[80vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 z-50 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 bg-indigo-600 rounded-t-2xl text-white">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <h3 className="font-medium">{t('ai.title')}</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
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
