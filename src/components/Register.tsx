import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, uploadProfile, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          profileImage: 'Please select a valid image file'
        }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profileImage: 'Image size must be less than 5MB'
        }));
        return;
      }
      
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      if (errors.profileImage) {
        setErrors(prev => ({
          ...prev,
          profileImage: ''
        }));
      }
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview('');
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      
      // Upload profile image if provided
      if (profileImage) {
        try {
          await uploadProfile(profileImage);
        } catch (profileError: any) {
          console.error('Profile upload failed:', profileError);
          // Don't fail the entire registration for profile upload failure
          // Just show a warning that profile upload failed
          setApiError(`Registration successful, but profile picture upload failed: ${profileError.message}`);
        }
      }
      
      navigate('/'); // Redirect to home after successful registration
    } catch (error: any) {
      setApiError(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-start justify-center px-8 py-8 pt-12 relative overflow-hidden">
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

      {/* Register Form */}
      <div className="max-w-sm w-full relative z-10">
        <div className="bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-2xl p-6 border border-neutral-700/30 animate-fadeIn">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
            <p className="text-neutral-300 text-sm">Join us and start your career journey</p>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-xs font-medium text-neutral-200 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-neutral-800/50 backdrop-blur-sm border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                  errors.full_name 
                    ? 'border-red-500 focus:ring-red-400' 
                    : 'border-neutral-600/40 focus:ring-opacity-50'
                }`}
                style={!errors.full_name ? { '--tw-ring-color': '#39FF14' } as React.CSSProperties : {}}
                placeholder="Enter your full name"
                disabled={isLoading}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-400">{errors.full_name}</p>
              )}
            </div>

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
                className={`w-full px-3 py-2 bg-neutral-800/50 backdrop-blur-sm border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                  errors.username 
                    ? 'border-red-500 focus:ring-red-400' 
                    : 'border-neutral-600/40 focus:ring-opacity-50'
                }`}
                style={!errors.username ? { '--tw-ring-color': '#39FF14' } as React.CSSProperties : {}}
                placeholder="Choose a username"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-400">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-200 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-neutral-800/50 backdrop-blur-sm border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-400' 
                    : 'border-neutral-600/40 focus:ring-opacity-50'
                }`}
                style={!errors.email ? { '--tw-ring-color': '#39FF14' } as React.CSSProperties : {}}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
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
                className={`w-full px-3 py-2 bg-neutral-800/50 backdrop-blur-sm border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                  errors.password 
                    ? 'border-red-500 focus:ring-red-400' 
                    : 'border-neutral-600/40 focus:ring-opacity-50'
                }`}
                style={!errors.password ? { '--tw-ring-color': '#39FF14' } as React.CSSProperties : {}}
                placeholder="Create a password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-neutral-200 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-neutral-800/50 backdrop-blur-sm border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                  errors.confirmPassword 
                    ? 'border-red-500 focus:ring-red-400' 
                    : 'border-neutral-600/40 focus:ring-opacity-50'
                }`}
                style={!errors.confirmPassword ? { '--tw-ring-color': '#39FF14' } as React.CSSProperties : {}}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Profile Image Upload */}
            <div>
              <label htmlFor="profileImage" className="block text-xs font-medium text-neutral-200 mb-1">
                Profile Picture (Optional)
              </label>
              
              {profileImagePreview ? (
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-neutral-600"
                    />
                    <button
                      type="button"
                      onClick={removeProfileImage}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-300">{profileImage?.name}</p>
                    <p className="text-xs text-neutral-500">
                      {profileImage && (profileImage.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={isLoading}
                    className={`w-full px-3 py-2 bg-neutral-800/50 backdrop-blur-sm border rounded-lg text-neutral-400 hover:bg-neutral-700/50 transition-colors text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.profileImage 
                        ? 'border-red-500' 
                        : 'border-neutral-600/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Choose profile picture</span>
                    </div>
                  </button>
                </div>
              )}
              
              {errors.profileImage && (
                <p className="mt-1 text-xs text-red-400">{errors.profileImage}</p>
              )}
              <p className="mt-1 text-xs text-neutral-500">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-black font-bold py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 text-sm mt-6"
              style={{ 
                backgroundColor: '#39FF14',
                boxShadow: '0 10px 30px rgba(57, 255, 20, 0.4), 0 0 60px rgba(57, 255, 20, 0.2)'
              }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-400 text-xs">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium transition-colors hover:underline"
                style={{ color: '#39FF14' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 