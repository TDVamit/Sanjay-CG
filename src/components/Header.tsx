import { Link, useLocation } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout, uploadProfile, removeProfile, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [profileError, setProfileError] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { name: 'HOME', path: '/' },
    { name: 'CAREER ASSESSMENT', path: '/assessment' },
    { name: 'RESUME ANALYZER', path: '/resume-analyzer' },
    { name: 'CAREER ROADMAPS', path: '/roadmaps' },
    { name: 'PERSONALIZED GUIDANCE', path: '/personalized-guidance' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setProfileError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setProfileError('Image size must be less than 5MB');
        return;
      }
      
      setProfileImage(file);
      setProfileError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfile = async () => {
    if (!profileImage) return;
    
    try {
      setProfileLoading(true);
      setProfileError('');
      await uploadProfile(profileImage);
      setIsProfileModalOpen(false);
      setProfileImage(null);
      setProfileImagePreview('');
    } catch (error: any) {
      setProfileError(error.message || 'Failed to upload profile picture');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRemoveProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError('');
      await removeProfile();
      setIsProfileModalOpen(false);
    } catch (error: any) {
      setProfileError(error.message || 'Failed to remove profile picture');
    } finally {
      setProfileLoading(false);
    }
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
    setProfileError('');
    setProfileImage(null);
    setProfileImagePreview('');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="bg-black text-white px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/main-logo.png" 
            alt="HCG Logo" 
            className="h-8 sm:h-10 lg:h-12 w-auto mr-2 sm:mr-4"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-4 xl:space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-xs xl:text-sm font-medium transition-colors duration-200 nav-hover whitespace-nowrap ${
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

        {/* Mobile Menu Button & User Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* User Section */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity"
              >
                {user?.user_profile ? (
                  <img
                    src={user.user_profile}
                    alt="Profile"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-green-400"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#39FF14' }}
                  >
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-white truncate max-w-24 sm:max-w-none">{user?.full_name}</div>
                  <div className="text-xs text-gray-300 truncate max-w-24 sm:max-w-none">@{user?.username}</div>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-300 transition-transform hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`} 
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
                    <div className="text-xs text-neutral-400 break-all">{user?.email}</div>
                    <div className="text-xs text-neutral-500 mt-1">Role: {user?.user_role}</div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={openProfileModal}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/30 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Manage Profile</span>
                    </button>
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
                          <span>Sign Out</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-neutral-900/90 backdrop-blur-md rounded-lg mt-4 border border-neutral-700/30">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  location.pathname === item.path
                    ? 'text-green-400 bg-neutral-800/50'
                    : 'text-white hover:text-green-400 hover:bg-neutral-800/30'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md mx-4 border border-neutral-700/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Manage Profile Picture</h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {profileError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700/30 rounded-lg text-red-300 text-sm">
                {profileError}
              </div>
            )}

            <div className="space-y-4">
              {/* Current Profile Picture */}
              <div className="flex justify-center">
                <div className="relative">
                  {user?.user_profile ? (
                    <img
                      src={user.user_profile}
                      alt="Current Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-green-400"
                    />
                  ) : (
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-green-400"
                      style={{ backgroundColor: '#39FF14' }}
                    >
                      <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Preview */}
              {profileImagePreview && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={profileImagePreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-blue-400"
                    />
                    <div className="absolute -top-2 -right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                      Preview
                    </div>
                  </div>
                </div>
              )}

              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={triggerFileInput}
                  className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Choose New Image</span>
                </button>

                {profileImage && (
                  <button
                    onClick={handleUploadProfile}
                    disabled={profileLoading}
                    className="w-full px-4 py-2 text-black font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    style={{ backgroundColor: '#39FF14' }}
                  >
                    {profileLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Upload Image</span>
                      </>
                    )}
                  </button>
                )}

                {user?.user_profile && (
                  <button
                    onClick={handleRemoveProfile}
                    disabled={profileLoading}
                    className="w-full px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {profileLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-300"></div>
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Remove Image</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 