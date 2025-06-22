import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  showNavigation?: boolean;
}

const ChatPopup = ({ isOpen, onClose }: ChatPopupProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm here to help you with your career guidance. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
      showNavigation: true
    }
  ]);
  const navigate = useNavigate();

  const navigationOptions = [
    { label: '🏠 Home', path: '/', color: '#39FF14' },
    { label: '📊 Assessment', path: '/assessment', color: '#00BFFF' },
    { label: '📄 Resume Analyzer', path: '/resume-analyzer', color: '#FF6B35' },
    { label: '🗺️ Career Roadmaps', path: '/roadmaps', color: '#8A2BE2' },
    { label: '🎯 Personal Guidance', path: '/personalized-guidance', color: '#FF1493' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    // Simulate bot response with navigation options
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: "Great question! I'd be happy to help you with that. You can explore different sections of our platform using the navigation buttons below, or feel free to ask me anything else!",
        sender: 'bot',
        timestamp: new Date(),
        showNavigation: true
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
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
              
              {/* Navigation buttons for bot messages */}
              {msg.sender === 'bot' && msg.showNavigation && (
                <div className="flex flex-col space-y-2 ml-2 sm:ml-4 mb-2">
                  <div className="text-xs text-gray-500 font-medium mb-1">Quick Navigation:</div>
                  <div className="grid grid-cols-2 gap-1 sm:gap-2">
                    {navigationOptions.slice(0, 4).map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleNavigation(option.path)}
                        className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-white rounded-xl hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center min-h-[44px]"
                        style={{ 
                          backgroundColor: option.color,
                          boxShadow: `0 4px 15px ${option.color}40`
                        }}
                      >
                        <span className="text-center leading-tight">{option.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-1 sm:gap-2 mt-1">
                    <button
                      onClick={() => handleNavigation(navigationOptions[4].path)}
                      className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-white rounded-xl hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center min-h-[44px]"
                      style={{ 
                        backgroundColor: navigationOptions[4].color,
                        boxShadow: `0 4px 15px ${navigationOptions[4].color}40`
                      }}
                    >
                      <span className="text-center leading-tight">{navigationOptions[4].label}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input with rounded corners */}
        <div className="p-3 sm:p-5 border-t border-gray-200/50 bg-gray-50/80 backdrop-blur-sm rounded-b-3xl">
          <div className="flex space-x-2 sm:space-x-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your career..."
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300/50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 shadow-inner text-sm"
              style={{ '--tw-ring-color': '#39FF14' } as React.CSSProperties}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              className="px-3 py-2 sm:px-5 sm:py-3 text-black font-bold rounded-2xl hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center min-w-[44px] min-h-[44px]"
              style={{ 
                backgroundColor: '#39FF14',
                boxShadow: '0 8px 25px rgba(57, 255, 20, 0.3)'
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPopup; 