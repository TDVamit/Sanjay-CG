import GuidanceAgents from './GuidanceAgents';

const PersonalizedGuidance = () => {
  return (
    <div className="min-h-screen bg-black py-8 relative overflow-hidden">
      {/* Background - minimal pulsing lights */}
      <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
        <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full animate-pulse-glow" style={{ backgroundColor: '#39FF14', filter: 'blur(60px)' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full animate-pulse-glow delay-1000" style={{ backgroundColor: '#39FF14', filter: 'blur(40px)' }}></div>
      </div>

      {/* Very subtle static grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

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