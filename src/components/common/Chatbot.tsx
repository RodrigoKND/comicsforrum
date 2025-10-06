import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotResponse {
  response: string;
  credits?: number;
  error?: string;
}

const SUGGESTIONS = [
  '¿Qué cómics están por salir?',
  '¿Cuál es el mejor manga del año?',
  'Recomiéndame arte conceptual',
  '¿Qué hay de nuevo en el mundo del cómic?',
];

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: '¡Hola! Soy tu asistente virtual. Puedo ayudarte con información sobre cómics, manga y arte. ¿En qué puedo ayudarte hoy?',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ message: messageText }),
        }
      );

      const data: ChatbotResponse = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.error || 'No tienes créditos disponibles. Se resetean cada 24 horas.',
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          if (data.credits !== undefined) {
            setCredits(data.credits);
          }
          return;
        }
        throw new Error('Error al obtener respuesta');
      }

      if (data.credits !== undefined) {
        setCredits(data.credits);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 flex flex-col z-50"
          >
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-white" />
                  <h3 className="text-white font-semibold">Asistente Virtual</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {credits !== null && (
                <div className="text-white/90 text-sm">
                  Créditos disponibles: {credits}/10
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  </div>
                </div>
              )}

              {messages.length === 1 && !isLoading && (
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">Sugerencias:</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(suggestion)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-full p-2 transition-all duration-300 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full p-4 shadow-2xl z-50 transition-all duration-300"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
};

export default Chatbot;
