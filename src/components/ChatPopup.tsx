import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI, type IntelligentChatResponse } from '../services/api';

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  recommendedPages?: string[];
}

const ChatPopup = ({ isOpen, onClose }: ChatPopupProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm here to help you with your career guidance. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
      recommendedPages: ['home', 'assessment', 'resume-analyzer', 'roadmaps', 'personalized-guidance']
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Page mapping for navigation and display
  const pageMapping = {
    'home': { label: '🏠 Home', path: '/', color: '#39FF14' },
    'assessment': { label: '📊 Assessment', path: '/assessment', color: '#00BFFF' },
    'resume-analyzer': { label: '📄 Resume Analyzer', path: '/resume-analyzer', color: '#FF6B35' },
    'roadmaps': { label: '🗺️ Career Roadmaps', path: '/roadmaps', color: '#8A2BE2' },
    'personalized-guidance': { label: '🎯 Personal Guidance', path: '/personalized-guidance', color: '#FF1493' }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Call the intelligent chat API
      const response: IntelligentChatResponse = await chatAPI.intelligentChat(message);
      
      const botResponse: Message = {
        id: messages.length + 2,
        text: response.response_to_user,
        sender: 'bot',
        timestamp: new Date(),
        recommendedPages: response.recommended_pages.filter(page => 
          Object.keys(pageMapping).includes(page)
        )
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      // Fallback response on error
      const errorResponse: Message = {
        id: messages.length + 2,
        text: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or feel free to explore our different sections using the navigation buttons below!",
        sender: 'bot',
        timestamp: new Date(),
        recommendedPages: ['home', 'assessment', 'resume-analyzer', 'roadmaps', 'personalized-guidance']
      };
      
      setMessages(prev => [...prev, errorResponse]);
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

  if (!isOpen) return null;

  return (
    <>
      {/* Very subtle overlay */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        style={{ backgroundColor: 'transparent' }}
      ></div>
      
      {/* Chat popup with enhanced rounded corners - responsive */}
      <div className="fixed bottom-16 right-2 sm:bottom-24 sm:right-6 bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl w-[calc(100vw-1rem)] max-w-[350px] sm:w-96 h-[400px] sm:h-[500px] flex flex-col z-50 border border-gray-200/30 mx-2 sm:mx-0">
        {/* Header with rounded corners */}
        <div className="bg-gradient-to-r from-black/95 to-gray-900/95 backdrop-blur-sm text-white p-4 sm:p-5 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-3 animate-pulse" style={{ backgroundColor: '#39FF14' }}></div>
            <span className="font-bold text-base sm:text-lg">Career Assistant</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-all duration-200 hover:scale-110 hover:rotate-90 p-1 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages with custom scrollbar */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {messages.map((msg) => (
            <div key={msg.id} className="animate-fadeIn">
              <div
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-2 sm:mb-3`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-xs px-3 sm:px-4 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm shadow-lg ${
                    msg.sender === 'user'
                      ? 'text-black font-medium rounded-br-md'
                      : 'bg-gray-100/80 backdrop-blur-sm text-gray-800 rounded-bl-md'
                  }`}
                  style={msg.sender === 'user' ? { backgroundColor: '#39FF14' } : {}}
                >
                  {msg.text}
                </div>
              </div>
              
              {/* Dynamic navigation buttons based on AI recommendations */}
              {msg.sender === 'bot' && msg.recommendedPages && msg.recommendedPages.length > 0 && (
                <div className="flex flex-col space-y-2 ml-2 sm:ml-4 mb-2">
                  <div className="text-xs text-gray-500 font-medium mb-1">Recommended for you:</div>
                  <div className="grid grid-cols-2 gap-1 sm:gap-2">
                    {msg.recommendedPages.slice(0, 4).map((pageKey, index) => {
                      const pageInfo = pageMapping[pageKey as keyof typeof pageMapping];
                      if (!pageInfo) return null;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleNavigation(pageInfo.path)}
                          className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-white rounded-xl hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center min-h-[44px]"
                          style={{ 
                            backgroundColor: pageInfo.color,
                            boxShadow: `0 4px 15px ${pageInfo.color}40`
                          }}
                        >
                          <span className="text-center leading-tight">{pageInfo.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Show remaining recommendations if more than 4 */}
                  {msg.recommendedPages.length > 4 && (
                    <div className="grid grid-cols-1 gap-1 sm:gap-2 mt-1">
                      {msg.recommendedPages.slice(4).map((pageKey, index) => {
                        const pageInfo = pageMapping[pageKey as keyof typeof pageMapping];
                        if (!pageInfo) return null;
                        
                        return (
                          <button
                            key={index + 4}
                            onClick={() => handleNavigation(pageInfo.path)}
                            className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-white rounded-xl hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center min-h-[44px]"
                            style={{ 
                              backgroundColor: pageInfo.color,
                              boxShadow: `0 4px 15px ${pageInfo.color}40`
                            }}
                          >
                            <span className="text-center leading-tight">{pageInfo.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start mb-2 sm:mb-3">
              <div className="bg-gray-100/80 backdrop-blur-sm text-gray-800 rounded-bl-md rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input with rounded corners */}
        <div className="p-3 sm:p-5 border-t border-gray-200/50 bg-gray-50/80 backdrop-blur-sm rounded-b-3xl">
          <div className="flex space-x-2 sm:space-x-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your career..."
              disabled={isLoading}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300/50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 shadow-inner text-sm disabled:opacity-50"
              style={{ '--tw-ring-color': '#39FF14' } as React.CSSProperties}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="px-3 py-2 sm:px-5 sm:py-3 text-black font-bold rounded-2xl hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center min-w-[44px] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ 
                backgroundColor: '#39FF14',
                boxShadow: '0 8px 25px rgba(57, 255, 20, 0.3)'
              }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-black"></div>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPopup; 