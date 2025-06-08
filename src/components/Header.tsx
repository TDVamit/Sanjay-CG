import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navItems = [
    { name: 'HOME', path: '/' },
    { name: 'CAREER ASSESSMENT', path: '/assessment' },
    { name: 'RESUME ANALYZER', path: '/resume-analyzer' },
    { name: 'CAREER ROADMAPS', path: '/roadmaps' },
    { name: 'PERSONALIZED GUIDANCE', path: '/guidance' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-black text-white px-8 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/main-logo.png" 
            alt="HCG Logo" 
            className="h-12 w-auto mr-4"
          />
        </div>

        {/* Navigation */}
        <nav className="flex space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-sm font-medium transition-colors duration-200 nav-hover ${
                location.pathname === item.path
                  ? 'border-b-2 pb-1'
                  : 'text-white'
              }`}
              style={{
                color: location.pathname === item.path ? '#39FF14' : undefined,
                borderBottomColor: location.pathname === item.path ? '#39FF14' : undefined
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#39FF14' }}
              >
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-white">{user?.full_name}</div>
                <div className="text-xs text-gray-300">@{user?.username}</div>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-300 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-neutral-900/70 backdrop-blur-md rounded-lg shadow-2xl border border-neutral-700/30 z-50">
                <div className="p-4 border-b border-neutral-700/30">
                  <div className="text-sm font-medium text-white">{user?.full_name}</div>
                  <div className="text-xs text-neutral-400">{user?.email}</div>
                </div>
                <div className="py-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/30 transition-colors flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-300"></div>
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign out</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link 
              to="/login"
              className="text-sm font-medium text-white hover:text-neutral-300 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/register"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: '#39FF14',
                color: 'black'
              }}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default Header; 