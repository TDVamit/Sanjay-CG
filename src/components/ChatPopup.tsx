import { useState } from 'react';

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatPopup = ({ isOpen, onClose }: ChatPopupProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm here to help you with your career guidance. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "Thank you for your message! Our career counselors will get back to you soon. In the meantime, feel free to take our career assessment to get personalized recommendations.",
        sender: 'bot',
        timestamp: new Date()
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
      {/* Very subtle overlay that doesn't block the background */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        style={{ backgroundColor: 'transparent' }}
      ></div>
      
      {/* Chat popup positioned in bottom right - no green border */}
      <div className="fixed bottom-20 right-6 bg-white/80 backdrop-blur-md rounded-lg shadow-2xl w-80 h-96 flex flex-col z-50">
        {/* Header */}
        <div className="bg-black/90 backdrop-blur-sm text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2 animate-pulse" style={{ backgroundColor: '#39FF14' }}></div>
            <span className="font-semibold">Career Guidance Chat</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors hover:scale-110 duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow-md ${
                  msg.sender === 'user'
                    ? 'text-black rounded-br-none'
                    : 'bg-gray-100/70 backdrop-blur-sm text-gray-800 rounded-bl-none'
                }`}
                style={msg.sender === 'user' ? { backgroundColor: '#39FF14' } : {}}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200/50 bg-gray-50/70 backdrop-blur-sm">
          <div className="flex space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500"
              style={{ '--tw-ring-color': '#39FF14' } as React.CSSProperties}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 text-black font-medium rounded-lg hover:opacity-80 transition-all duration-200 hover:scale-105 shadow-md"
              style={{ backgroundColor: '#39FF14' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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