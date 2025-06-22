import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guidanceAgentAPI, categoryAPI, type GuidanceAgentResponse, type CategoryResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type ViewMode = 'view' | 'edit';

const GuidanceAgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agent, setAgent] = useState<GuidanceAgentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [saving, setSaving] = useState(false);
  
  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedLink, setEditedLink] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>('');
  
  // Category management
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState<CategoryResponse[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.user_role === 'admin';

  // Helper functions
  const getCategoryId = (category: any): string | undefined => {
    return category._id || category.id;
  };

  const extractCategoryIds = (categories: any[]): string[] => {
    return categories?.map(cat => getCategoryId(cat)).filter((id): id is string => id !== undefined && id !== null && id !== '') || [];
  };

  // Load agent
  const loadAgent = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');
      const data = await guidanceAgentAPI.getById(id);
      setAgent(data);
      setEditedName(data.name);
      setEditedDescription(data.description);
      setEditedLink(data.link);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load guidance agent');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgent();
  }, [id]);

  // Category management functions
  const handleCategoryRemove = async (categoryId: string) => {
    if (!agent) return;
    
    setSaving(true);
    setError('');
    try {
      const currentCategoryIds = extractCategoryIds(agent.categories || []);
      const validCategoryIds = currentCategoryIds.filter(id => id !== categoryId);
      
      const updated = await guidanceAgentAPI.update(agent._id, {
        name: agent.name,
        description: agent.description,
        link: agent.link,
        category_ids: validCategoryIds
      });
      setAgent(updated);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to remove category';
      setError(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const loadCategorySuggestions = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCategorySuggestions([]);
      return;
    }
    
    setLoadingSuggestions(true);
    try {
      const response = await categoryAPI.getAll(1, 10, searchTerm);
      setCategorySuggestions(response.items);
    } catch (err) {
      console.error('Failed to load category suggestions:', err);
      setCategorySuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleCategoryInputChange = (value: string) => {
    setCategoryInputValue(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = window.setTimeout(() => {
      loadCategorySuggestions(value);
    }, 300);
  };

  const handleCategorySuggestionSelect = async (category: CategoryResponse) => {
    if (!agent) return;
    
    const currentCategoryIds = extractCategoryIds(agent.categories || []);
    const categoryId = getCategoryId(category);
    
    if (!categoryId) {
      console.error('Category has no valid ID:', category);
      return;
    }
    
    if (currentCategoryIds.includes(categoryId)) {
      setCategoryInputValue('');
      setCategorySuggestions([]);
      setShowCategoryInput(false);
      return;
    }
    
    setSaving(true);
    setError('');
    try {
      const newCategoryIds = [...currentCategoryIds, categoryId];
      
      const updated = await guidanceAgentAPI.update(agent._id, {
        name: agent.name,
        description: agent.description,
        link: agent.link,
        category_ids: newCategoryIds
      });
      
      setAgent(updated);
      setCategoryInputValue('');
      setCategorySuggestions([]);
      setShowCategoryInput(false);
    } catch (err: any) {
      console.error('Failed to add category:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to add category';
      setError(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewCategory = async () => {
    if (!agent || !categoryInputValue.trim()) return;
    
    setCreatingCategory(true);
    setError('');
    try {
      const newCategory = await categoryAPI.create({
        name: categoryInputValue.trim(),
        description: categoryInputValue.trim()
      });
      
      const currentCategoryIds = extractCategoryIds(agent.categories || []);
      const newCategoryId = getCategoryId(newCategory);
      
      if (!newCategoryId) {
        console.error('Created category has no valid ID:', newCategory);
        setError('Failed to create category: Invalid ID returned');
        return;
      }
      
      const newCategoryIds = [...currentCategoryIds, newCategoryId];
      
      const updated = await guidanceAgentAPI.update(agent._id, {
        name: agent.name,
        description: agent.description,
        link: agent.link,
        category_ids: newCategoryIds
      });
      
      setAgent(updated);
      setCategoryInputValue('');
      setCategorySuggestions([]);
      setShowCategoryInput(false);
    } catch (err: any) {
      console.error('Failed to create category:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to create category';
      setError(String(errorMessage));
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCategoryInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (categorySuggestions.length > 0) {
        handleCategorySuggestionSelect(categorySuggestions[0]);
      } else {
        handleCreateNewCategory();
      }
    } else if (e.key === 'Escape') {
      setCategoryInputValue('');
      setCategorySuggestions([]);
      setShowCategoryInput(false);
    }
  };

  // Edit functions
  const handleNameSave = async () => {
    if (!agent || !editedName.trim()) return;
    
    setSaving(true);
    setError('');
    try {
      const currentCategoryIds = extractCategoryIds(agent.categories || []);
      
      const updated = await guidanceAgentAPI.update(agent._id, {
        name: editedName.trim(),
        description: agent.description,
        link: agent.link,
        category_ids: currentCategoryIds
      });
      setAgent(updated);
      setIsEditingName(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to update name';
      setError(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const handleDescriptionSave = async () => {
    if (!agent || !editedDescription.trim()) return;
    
    setSaving(true);
    setError('');
    try {
      const currentCategoryIds = extractCategoryIds(agent.categories || []);
      
      const updated = await guidanceAgentAPI.update(agent._id, {
        name: agent.name,
        description: editedDescription.trim(),
        link: agent.link,
        category_ids: currentCategoryIds
      });
      setAgent(updated);
      setIsEditingDescription(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to update description';
      setError(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const handleLinkSave = async () => {
    if (!agent || !editedLink.trim()) return;
    
    setSaving(true);
    setError('');
    try {
      const currentCategoryIds = extractCategoryIds(agent.categories || []);
      
      const updated = await guidanceAgentAPI.update(agent._id, {
        name: agent.name,
        description: agent.description,
        link: editedLink.trim(),
        category_ids: currentCategoryIds
      });
      setAgent(updated);
      setIsEditingLink(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to update link';
      setError(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePicSave = async () => {
    if (!agent || !profilePic) return;
    
    setSaving(true);
    setError('');
    try {
      const currentCategoryIds = extractCategoryIds(agent.categories || []);
      
      const updated = await guidanceAgentAPI.update(agent._id, {
        name: agent.name,
        description: agent.description,
        link: agent.link,
        category_ids: currentCategoryIds
      }, profilePic);
      setAgent(updated);
      setProfilePic(null);
      setProfilePicPreview('');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to update profile picture';
      setError(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const toggleEditMode = () => {
    if (viewMode === 'edit') {
      // Cancel all edits
      setIsEditingName(false);
      setIsEditingDescription(false);
      setIsEditingLink(false);
      setEditedName(agent?.name || '');
      setEditedDescription(agent?.description || '');
      setEditedLink(agent?.link || '');
      setShowCategoryInput(false);
      setCategoryInputValue('');
      setCategorySuggestions([]);
      setProfilePic(null);
      setProfilePicPreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    setViewMode(viewMode === 'edit' ? 'view' : 'edit');
  };

  const goBackToList = () => {
    navigate('/personalized-guidance');
  };

  // Focus input when shown
  useEffect(() => {
    if (showCategoryInput && categoryInputRef.current) {
      categoryInputRef.current.focus();
    }
  }, [showCategoryInput]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black py-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
          <div className="absolute inset-0 bg-grid-pattern animate-grid-move"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md border border-neutral-700/20 p-8">
            <div className="text-center">
              <div className="inline-flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#39FF14' }}></div>
                <span className="text-neutral-300 text-lg">Loading guidance agent...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="min-h-screen bg-black py-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
          <div className="absolute inset-0 bg-grid-pattern animate-grid-move"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md border border-neutral-700/20 p-8">
            <div className="text-center">
              <div className="text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-200 text-lg mb-4">{error}</p>
              <button
                onClick={goBackToList}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="min-h-screen bg-black py-8 relative overflow-hidden">
      {/* Background elements (same as PersonalizedGuidance) */}
      <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
        <div className="absolute inset-0 bg-grid-pattern animate-grid-move"></div>
      </div>

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

      <div className="absolute inset-0 pointer-events-none" style={{ filter: 'blur(5px)' }}>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-green-400 to-transparent animate-beam opacity-10"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-green-400 to-transparent animate-beam-delayed opacity-10"></div>
        <div className="absolute left-0 top-1/3 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent animate-beam-horizontal opacity-10"></div>
      </div>

      <div className="absolute inset-0 opacity-8" style={{ filter: 'blur(4px)' }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full animate-pulse-glow" style={{ backgroundColor: '#39FF14', filter: 'blur(120px)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full animate-pulse-glow delay-1000" style={{ backgroundColor: '#39FF14', filter: 'blur(100px)' }}></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full animate-pulse-glow delay-500" style={{ backgroundColor: '#39FF14', filter: 'blur(80px)', transform: 'translate(-50%, -50%)' }}></div>
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{ filter: 'blur(10px)' }}>
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan opacity-15"></div>
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan-reverse opacity-15" style={{ top: '60%' }}></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md border border-neutral-700/20 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={goBackToList}
                className="p-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                title="Back to list"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white">Guidance Agent Details</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <a
                href={agent.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Visit Agent</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              
              {isAdmin && (
                <button
                  onClick={toggleEditMode}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'edit'
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {viewMode === 'edit' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    )}
                  </svg>
                  <span>{viewMode === 'edit' ? 'Cancel Edit' : 'Edit Agent'}</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Agent Details */}
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md border border-neutral-700/20 p-6">
          {/* Profile Section */}
          <div className="flex items-start space-x-6 mb-8">
            <div className="relative">
              {profilePicPreview ? (
                <img
                  src={profilePicPreview}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-2 border-blue-400"
                />
              ) : agent.profile_pic ? (
                <img
                  src={`data:image/jpeg;base64,${agent.profile_pic}`}
                  alt={agent.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-neutral-700 flex items-center justify-center">
                  <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              
              {viewMode === 'edit' && (
                <div className="absolute -bottom-2 -right-2 flex space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                    className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    title="Select profile picture"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  {profilePic && (
                    <button
                      type="button"
                      onClick={handleProfilePicSave}
                      disabled={saving}
                      className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
                      title="Save profile picture"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              )}
              
              {/* Show selected file name */}
              {profilePic && viewMode === 'edit' && (
                <div className="mt-2 text-xs text-neutral-400 text-center">
                  {profilePic.name}
                </div>
              )}
            </div>

            <div className="flex-1">
              {/* Name Section */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-xl font-semibold text-white">Name</h2>
                  {!isEditingName && viewMode === 'edit' && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-neutral-400 hover:text-white transition-colors"
                      title="Edit name"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {isEditingName ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full bg-neutral-800/50 text-white border border-neutral-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                      placeholder="Agent name..."
                      disabled={saving}
                    />
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleNameSave}
                        disabled={saving || !editedName.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setEditedName(agent.name);
                        }}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
                )}
              </div>

              {/* Link Section */}
              <div className="mb-4">
                {(isEditingLink || viewMode === 'edit') && (
                  <div className="flex items-center space-x-2 mb-2">
                    <h2 className="text-xl font-semibold text-white">Link</h2>
                    {!isEditingLink && viewMode === 'edit' && (
                      <button
                        onClick={() => setIsEditingLink(true)}
                        className="p-1 text-neutral-400 hover:text-white transition-colors"
                        title="Edit link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {isEditingLink ? (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={editedLink}
                      onChange={(e) => setEditedLink(e.target.value)}
                      className="w-full bg-neutral-800/50 text-white border border-neutral-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                      placeholder="https://example.com"
                      disabled={saving}
                    />
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleLinkSave}
                        disabled={saving || !editedLink.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingLink(false);
                          setEditedLink(agent.link);
                        }}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    {viewMode === 'edit' && (
                      <span className="text-neutral-300 break-all flex-1 mr-4">{agent.link}</span>
                    )}
                    <a
                      href={agent.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <span>Visit Agent</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <h2 className="text-xl font-semibold text-white">Categories</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {agent.categories?.map((category) => {
                const categoryId = getCategoryId(category);
                if (!categoryId) return null;
                
                return (
                  <div
                    key={categoryId}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600/20 border border-green-400/30 text-green-300 rounded-full text-sm"
                  >
                    <span>{category.name}</span>
                    {viewMode === 'edit' && (
                      <button
                        onClick={() => handleCategoryRemove(categoryId)}
                        disabled={saving}
                        className="ml-1 text-green-300 hover:text-red-300 transition-colors disabled:opacity-50"
                        title="Remove category"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
              
              {/* Add Category Button - only show in edit mode */}
              {viewMode === 'edit' && (
                <div className="relative">
                  {!showCategoryInput ? (
                    <button
                      onClick={() => setShowCategoryInput(true)}
                      disabled={saving}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600/20 border border-blue-400/30 text-blue-300 rounded-full text-sm hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                      title="Add category"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add</span>
                    </button>
                  ) : (
                    <div className="relative">
                      <input
                        ref={categoryInputRef}
                        type="text"
                        value={categoryInputValue}
                        onChange={(e) => handleCategoryInputChange(e.target.value)}
                        onKeyDown={handleCategoryInputKeyPress}
                        onBlur={(e) => {
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (!relatedTarget || !relatedTarget.closest('.category-suggestions')) {
                            setTimeout(() => {
                              setShowCategoryInput(false);
                              setCategoryInputValue('');
                              setCategorySuggestions([]);
                            }, 150);
                          }
                        }}
                        placeholder="Enter category name..."
                        disabled={creatingCategory}
                        className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-full text-white text-sm focus:outline-none focus:border-blue-500 w-48"
                      />
                      
                      {/* Loading indicator */}
                      {loadingSuggestions && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400"></div>
                        </div>
                      )}
                      
                      {/* Suggestions dropdown */}
                      {(categorySuggestions.length > 0 || (categoryInputValue.trim() && !loadingSuggestions)) && (
                        <div className="category-suggestions absolute top-full left-0 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                          {categorySuggestions.map((suggestion) => (
                            <button
                              key={`suggestion-${getCategoryId(suggestion)}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCategorySuggestionSelect(suggestion);
                              }}
                              disabled={creatingCategory}
                              className="w-full text-left px-3 py-2 text-white text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 first:rounded-t-lg last:rounded-b-lg"
                            >
                              <div className="font-medium">{suggestion.name}</div>
                              {suggestion.description && suggestion.description !== suggestion.name && (
                                <div className="text-xs text-gray-400">{suggestion.description}</div>
                              )}
                            </button>
                          ))}
                          
                          {/* Create new option */}
                          {categoryInputValue.trim() && !categorySuggestions.some(s => s.name.toLowerCase() === categoryInputValue.toLowerCase()) && (
                            <button
                              key="create-new-category"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCreateNewCategory();
                              }}
                              disabled={creatingCategory}
                              className="w-full text-left px-3 py-2 text-blue-300 text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 border-t border-gray-600 rounded-b-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Create "{categoryInputValue.trim()}"</span>
                              </div>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {agent.categories?.length === 0 && !showCategoryInput && (
                <p className="text-neutral-400 text-sm">No categories assigned</p>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <h2 className="text-xl font-semibold text-white">Description</h2>
              {!isEditingDescription && viewMode === 'edit' && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="p-1 text-neutral-400 hover:text-white transition-colors"
                  title="Edit description"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
            
            {isEditingDescription ? (
              <div className="space-y-3">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full bg-neutral-800/50 text-white border border-neutral-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 resize-vertical"
                  rows={4}
                  placeholder="Agent description..."
                  disabled={saving}
                />
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDescriptionSave}
                    disabled={saving || !editedDescription.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingDescription(false);
                      setEditedDescription(agent.description);
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {agent.description || 'No description provided.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidanceAgentDetail; 