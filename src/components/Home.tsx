import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatPopup from './ChatPopup';

const Home = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex items-start justify-center px-8 pt-8 relative overflow-hidden">
      {/* Animated Grid Background - More Blurry */}
      <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
        <div className="absolute inset-0 bg-grid-pattern animate-grid-move"></div>
      </div>

      {/* Floating Particles - More Blurry */}
      <div className="absolute inset-0 pointer-events-none" style={{ filter: 'blur(100px)' }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Larger Floating Orbs - More Blurry */}
      <div className="absolute inset-0 pointer-events-none" style={{ filter: 'blur(3px)' }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-float-slow"
            style={{
              backgroundColor: '#39FF14',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
              opacity: 0.2,
            }}
          />
        ))}
      </div>

      {/* Animated Beams - More Blurry */}
      <div className="absolute inset-0 pointer-events-none" style={{ filter: 'blur(5px)' }}>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-green-400 to-transparent animate-beam opacity-10"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-green-400 to-transparent animate-beam-delayed opacity-10"></div>
        <div className="absolute left-0 top-1/3 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent animate-beam-horizontal opacity-10"></div>
      </div>

      {/* Enhanced Background blur circles */}
      <div className="absolute inset-0 opacity-8" style={{ filter: 'blur(4px)' }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full animate-pulse-glow" style={{ backgroundColor: '#39FF14', filter: 'blur(120px)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full animate-pulse-glow delay-1000" style={{ backgroundColor: '#39FF14', filter: 'blur(100px)' }}></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full animate-pulse-glow delay-500" style={{ backgroundColor: '#39FF14', filter: 'blur(80px)', transform: 'translate(-50%, -50%)' }}></div>
      </div>

      {/* Scanning Lines - More Blurry */}
      <div className="absolute inset-0 pointer-events-none" style={{ filter: 'blur(10px)' }}>
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan opacity-15"></div>
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan-reverse opacity-15" style={{ top: '60%' }}></div>
      </div>

      {/* Matrix-like falling code effect - More Blurry */}
      <div className="absolute inset-0 pointer-events-none opacity-3" style={{ filter: 'blur(2px)' }}>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute text-green-400 text-xs font-mono animate-matrix-fall"
            style={{
              left: `${i * 10}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${5 + Math.random() * 3}s`,
            }}
          >
            {Array.from({ length: 20 }, () => Math.random() > 0.5 ? '1' : '0').join('')}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 mt-8">
        {/* Left side - Hero Image */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative animate-fadeInLeft">
            {/* Hero Image with enhanced hover effect - No border background */}
            <div className="w-[500px] h-[600px] flex items-center justify-center transform hover:scale-105 transition-transform duration-500 relative z-10">
              <img 
                src="/hero-image.png" 
                alt="Career Guidance Illustration" 
                className="w-full h-full object-contain drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 25px 50px rgba(57, 255, 20, 0.3))' }}
              />
            </div>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="text-center lg:text-left animate-fadeInRight pt-16">
          <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black mb-4 leading-tight">
            <span 
              className="text-white drop-shadow-2xl animate-slideInUp hover:animate-text-glow transition-all duration-300"
              style={{ 
                textShadow: '0 10px 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.1)' 
              }}
            >
              SANJAY
            </span>
            <br />
            <span 
              className="animate-slideInUp delay-300 hover:animate-text-glow transition-all duration-300"
              style={{ 
                color: '#39FF14',
                textShadow: '0 10px 30px rgba(57, 255, 20, 0.6), 0 0 60px rgba(57, 255, 20, 0.3)' 
              }}
            >
              CAREER
            </span>
            <br />
            <span 
              className="text-white drop-shadow-2xl animate-slideInUp delay-500 hover:animate-text-glow transition-all duration-300"
              style={{ 
                textShadow: '0 10px 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.1)' 
              }}
            >
              GUIDANCE
            </span>
          </h1>
          
          <div className="mb-8 animate-slideInUp delay-700">
            <Link
              to="/assessment"
              className="inline-block text-black font-bold text-xl px-10 py-5 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl animate-bounce-slow relative overflow-hidden"
              style={{ 
                backgroundColor: '#39FF14',
                boxShadow: '0 20px 40px rgba(57, 255, 20, 0.4), 0 0 60px rgba(57, 255, 20, 0.2)'
              }}
            >
              <span className="relative z-10">Take Assessment</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transition-opacity duration-300 animate-shimmer"></div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Chat Button - Fixed positioning */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:scale-125 transition-all duration-300 relative"
          style={{ 
            backgroundColor: '#39FF14',
            boxShadow: '0 10px 30px rgba(57, 255, 20, 0.6), 0 0 60px rgba(57, 255, 20, 0.3)'
          }}
          title="Open Chat"
        >
          <svg className="w-6 h-6 text-black relative z-10" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Chat Popup */}
      <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default Home; 