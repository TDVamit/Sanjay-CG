import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 relative overflow-hidden">
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

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center relative z-10 mt-4 sm:mt-6 lg:mt-8">
        {/* Left side - Hero Image */}
        <div className="flex justify-center lg:justify-start order-2 lg:order-1">
          <div className="relative animate-fadeInLeft">
            {/* Hero Image with enhanced hover effect - No border background */}
            <div className="w-[280px] h-[340px] sm:w-[350px] sm:h-[420px] md:w-[420px] md:h-[500px] lg:w-[450px] lg:h-[540px] xl:w-[500px] xl:h-[600px] flex items-center justify-center transform hover:scale-105 transition-transform duration-500 relative z-10">
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
        <div className="text-center lg:text-left animate-fadeInRight pt-4 sm:pt-8 lg:pt-16 order-1 lg:order-2">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black mb-4 leading-tight">
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
          
          <div className="mb-6 sm:mb-8 animate-slideInUp delay-700">
            <Link
              to="/assessment"
              className="inline-block text-black font-bold text-base sm:text-lg lg:text-xl px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl animate-bounce-slow relative overflow-hidden"
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
    </div>
  );
};

export default Home; 