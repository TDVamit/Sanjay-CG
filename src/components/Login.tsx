import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear API error
    if (apiError) {
      setApiError('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
      navigate('/'); // Redirect to home after successful login
    } catch (error: any) {
      setApiError(error.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 relative overflow-hidden">
      {/* Background - minimal pulsing lights */}
      <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
        <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full animate-pulse-glow" style={{ backgroundColor: '#39FF14', filter: 'blur(60px)' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full animate-pulse-glow delay-1000" style={{ backgroundColor: '#39FF14', filter: 'blur(40px)' }}></div>
      </div>

      {/* Very subtle static grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Login Form */}
      <div className="max-w-sm w-full relative z-10">
        <div className="bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-2xl p-4 sm:p-6 border border-neutral-700/30 animate-fadeIn">
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Welcome Back</h1>
            <p className="text-neutral-300 text-sm">Sign in to your account</p>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-neutral-200 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 sm:py-2 bg-neutral-800/50 backdrop-blur-sm border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                  errors.username 
                    ? 'border-red-500 focus:ring-red-400' 
                    : 'border-neutral-600/40 focus:ring-opacity-50'
                }`}
                style={!errors.username ? { '--tw-ring-color': '#39FF14' } as React.CSSProperties : {}}
                placeholder="Enter your username"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-400">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-neutral-200 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 sm:py-2 bg-neutral-800/50 backdrop-blur-sm border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                  errors.password 
                    ? 'border-red-500 focus:ring-red-400' 
                    : 'border-neutral-600/40 focus:ring-opacity-50'
                }`}
                style={!errors.password ? { '--tw-ring-color': '#39FF14' } as React.CSSProperties : {}}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-black font-bold py-3 sm:py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 text-sm"
              style={{ 
                backgroundColor: '#39FF14',
                boxShadow: '0 10px 30px rgba(57, 255, 20, 0.4), 0 0 60px rgba(57, 255, 20, 0.2)'
              }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-semibold hover:underline transition-colors"
                style={{ color: '#39FF14' }}
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 