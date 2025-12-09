import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, ExternalLink, WifiOff } from 'lucide-react';
import { chatWithGemini } from '../services/geminiService';

interface WikiAssistantProps {
    isOpen: boolean;
    onClose: () => void;
}

const WikiAssistant: React.FC<WikiAssistantProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        
        if (!isOnline) {
             setMessages(prev => [...prev, { role: 'user', text: inputValue }]);
             setTimeout(() => {
                setMessages(prev => [...prev, { role: 'model', text: "Lo siento, necesito conexión a internet para usar la IA." }]);
                setInputValue('');
             }, 500);
             return;
        }

        const userMsg = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const systemPrompt = "Eres un experto en el plugin ItemsAdder para Minecraft. Tu objetivo es ayudar a los usuarios a configurar items, crear texturas y entender la configuración YAML. Responde siempre en Español y sé conciso y técnico cuando sea necesario.";
            
            const responseText = await chatWithGemini(systemPrompt, userMsg);
            
            setMessages(prev => [...prev, { role: 'model', text: responseText }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: "Hubo un error al conectar con la IA." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8 pointer-events-auto">
            <div className="w-full max-w-2xl h-[80vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-blue-700 to-purple-800 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-full">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Asistente ItemsAdder</h3>
                            <p className="text-xs text-blue-200">Powered by Toolkit AI</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto bg-gray-950 space-y-6 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                            {isOnline ? (
                                <>
                                    <Bot size={64} className="mb-4 text-gray-700" />
                                    <p className="mb-2 text-lg">¿En qué puedo ayudarte hoy?</p>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => setInputValue("¿Cómo creo una armadura custom?")} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-full border border-gray-700 transition-colors">
                                            Crear armadura custom
                                        </button>
                                        <button onClick={() => setInputValue("Dame la config de una espada de obsidiana")} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-full border border-gray-700 transition-colors">
                                            Ejemplo espada YAML
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <WifiOff size={64} className="mb-4 text-gray-700" />
                                    <p className="mb-2 text-lg">Modo Offline Activo</p>
                                    <p className="text-xs">Conecta a internet para usar el asistente.</p>
                                </>
                            )}
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                            }`}>
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-3 text-gray-500 text-sm pl-2">
                            <Loader2 size={16} className="animate-spin text-blue-500" /> 
                            <span className="animate-pulse">Toolkit AI está escribiendo...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-gray-900 border-t border-gray-800">
                    <div className="relative max-w-4xl mx-auto">
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isOnline ? "Pregunta sobre configs, texturas o errores..." : "Sin conexión..."}
                            disabled={!isOnline}
                            className={`w-full bg-gray-800 text-white rounded-xl py-4 pl-5 pr-12 text-sm focus:ring-2 focus:ring-blue-600 outline-none border border-gray-700 shadow-inner ${!isOnline ? 'cursor-not-allowed opacity-50' : ''}`}
                            autoFocus
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim() || !isOnline}
                            className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WikiAssistant;