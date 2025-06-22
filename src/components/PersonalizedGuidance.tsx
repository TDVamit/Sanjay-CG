import React from 'react';
import GuidanceAgents from './GuidanceAgents';

const PersonalizedGuidance = () => {
  return (
    <div className="min-h-screen bg-black py-8 relative overflow-hidden">
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

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Guidance Agents Section */}
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md p-6 border border-neutral-700/20">
          <GuidanceAgents />
        </div>
      </div>
    </div>
  );
};

export default PersonalizedGuidance; 