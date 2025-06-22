import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roadmapAPI, tokenManager, categoryAPI, type RoadmapResponse, type CategoryResponse } from '../services/api';
import RoadmapBuilder from './RoadmapBuilder';
import RoadmapVisualization from './RoadmapVisualization';
import { useAuth } from '../contexts/AuthContext';

type ViewMode = 'view' | 'builder';

// Special category IDs that should be handled separately
const SPECIAL_CATEGORIES = {
  ROLE_BASED: '5717636e-6ff0-4a91-9cdb-678309c69514',
  SKILL_BASED: 'f8f2a743-2db7-4fc2-a77f-8ae7c2a8d99c'
} as const;

const RoadmapDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [, setSelectedCategoryIds] = useState<string[]>([]);
  
  
  // Add edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Special category selection for edit mode
  const [selectedSpecialCategory, setSelectedSpecialCategory] = useState<string>(SPECIAL_CATEGORIES.SKILL_BASED);
  
  // Inline category management state
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState<CategoryResponse[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | undefined>(undefined);

  // Check if user is admin
  const isAdmin = user?.user_role === 'admin';

  // Helper function to extract category ID (handles both _id and id properties)
  const getCategoryId = (category: any): string | undefined => {
    return category._id || category.id;
  };

  // Helper function to extract category IDs from categories array
  const extractCategoryIds = (categories: any[]): string[] => {
    return categories?.map(cat => getCategoryId(cat)).filter((id): id is string => id !== undefined && id !== null && id !== '') || [];
  };

  // Helper function to get current special category
  const getCurrentSpecialCategory = (): string => {
    if (!roadmap?.categories) return SPECIAL_CATEGORIES.SKILL_BASED;
    
    const hasSkillBased = roadmap.categories.some(cat => getCategoryId(cat) === SPECIAL_CATEGORIES.SKILL_BASED);
    const hasRoleBased = roadmap.categories.some(cat => getCategoryId(cat) === SPECIAL_CATEGORIES.ROLE_BASED);
    
    // Skill-based takes precedence
    if (hasSkillBased) return SPECIAL_CATEGORIES.SKILL_BASED;
    if (hasRoleBased) return SPECIAL_CATEGORIES.ROLE_BASED;
    
    return SPECIAL_CATEGORIES.SKILL_BASED; // Default
  };

  // Helper function to update special category
  const updateSpecialCategory = async (newSpecialCategory: string) => {
    if (!roadmap) return;
    
    setSaving(true);
    setError('');
    try {
      // Get current non-special categories
      const currentCategoryIds = extractCategoryIds(roadmap.categories || []);
      const nonSpecialCategoryIds = currentCategoryIds.filter(id => 
        id !== SPECIAL_CATEGORIES.SKILL_BASED && 
        id !== SPECIAL_CATEGORIES.ROLE_BASED
      );
      
      // Add the new special category
      const newCategoryIds = [...nonSpecialCategoryIds, newSpecialCategory];
      
      const updated = await roadmapAPI.update(roadmap._id, {
        name: roadmap.name,
        roadmap: roadmap.roadmap,
        description: roadmap.description,
        category_ids: newCategoryIds
      });
      setRoadmap(updated);
      setSelectedSpecialCategory(newSpecialCategory);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to update roadmap type';
      setError(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  // Load roadmap details
  const loadRoadmap = async () => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await roadmapAPI.getById(id);
      setRoadmap(response);
      setEditedTitle(response.name);
      setEditedDescription(response.description);
      

      // Ensure we filter out any invalid category IDs and log the process
      const categoryIds = response.categories?.map(cat => {
        // Check for both _id and id properties
        const categoryId = getCategoryId(cat);
        
        const isValid = categoryId !== undefined && categoryId !== null && categoryId !== '';
        if (!isValid) {
          console.warn('Invalid category ID found:', categoryId, 'for category:', cat);
        }
        return categoryId;
      }).filter((id): id is string => {
        const isValid = id !== undefined && id !== null && id !== '';
        return isValid;
      }) || [];
      

      setSelectedCategoryIds(categoryIds);
      
      // Set the current special category
      const currentSpecialCategory = (() => {
        const hasSkillBased = response.categories?.some(cat => getCategoryId(cat) === SPECIAL_CATEGORIES.SKILL_BASED);
        const hasRoleBased = response.categories?.some(cat => getCategoryId(cat) === SPECIAL_CATEGORIES.ROLE_BASED);
        
        // Skill-based takes precedence
        if (hasSkillBased) return SPECIAL_CATEGORIES.SKILL_BASED;
        if (hasRoleBased) return SPECIAL_CATEGORIES.ROLE_BASED;
        
        return SPECIAL_CATEGORIES.SKILL_BASED; // Default
      })();
      setSelectedSpecialCategory(currentSpecialCategory);
      
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to load roadmap';
      setError(String(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, [id]);

  // Sync selectedCategoryIds whenever roadmap.categories changes
  useEffect(() => {
    if (roadmap?.categories) {
      const categoryIds = extractCategoryIds(roadmap.categories);
      

      setSelectedCategoryIds(categoryIds);
    }
  }, [roadmap?.categories]);

  // Handle roadmap save from builder
  const handleRoadmapSave = async (roadmapJson: string) => {
    if (!roadmap) return;
    
    setLoading(true);
    setError('');
    try {
      // Use roadmap.categories as source of truth instead of selectedCategoryIds
      const validCategoryIds = extractCategoryIds(roadmap.categories || []);
      
      const updated = await roadmapAPI.update(roadmap._id, {
        name: roadmap.name,
        roadmap: roadmapJson,
        description: roadmap.description,
        category_ids: validCategoryIds.length > 0 ? validCategoryIds : undefined
      });
      setRoadmap(updated);
      setViewMode('view');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to save roadmap';
      setError(String(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  // Handle title/description updates
  const handleTitleSave = async () => {
    if (!roadmap || !editedTitle.trim()) return;
    
    setSaving(true);
    setError('');
    try {
      // Use roadmap.categories as source of truth instead of selectedCategoryIds
      const validCategoryIds = extractCategoryIds(roadmap.categories || []);
      
      const updated = await roadmapAPI.update(roadmap._id, {
        name: editedTitle.trim(),
        roadmap: roadmap.roadmap,
        description: roadmap.description,
        category_ids: validCategoryIds.length > 0 ? validCategoryIds : undefined
      });
      setRoadmap(updated);
      setIsEditingTitle(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to update title';
      setError(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const handleDescriptionSave = async () => {
    if (!roadmap) return;
    
    setSaving(true);
    setError('');
    try {
      // Use roadmap.categories as source of truth instead of selectedCategoryIds
      const validCategoryIds = extractCategoryIds(roadmap.categories || []);
      
      const updated = await roadmapAPI.update(roadmap._id, {
        name: roadmap.name,
        roadmap: roadmap.roadmap,
        description: editedDescription.trim(),
        category_ids: validCategoryIds.length > 0 ? validCategoryIds : undefined
      });
      setRoadmap(updated);
      setIsEditingDescription(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to update description';
      setError(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

 
  // Handle category removal
  const handleCategoryRemove = async (categoryId: string) => {
    if (!roadmap) return;
    
    setSaving(true);
    setError('');
    try {
      // Use roadmap.categories as source of truth instead of selectedCategoryIds
      const currentCategoryIds = extractCategoryIds(roadmap.categories || []);
      const validCategoryIds = currentCategoryIds.filter(id => id !== categoryId);
      

      
      const updated = await roadmapAPI.update(roadmap._id, {
        name: roadmap.name,
        roadmap: roadmap.roadmap,
        description: roadmap.description,
        category_ids: validCategoryIds.length > 0 ? validCategoryIds : undefined
      });
      setRoadmap(updated);
      // Note: selectedCategoryIds will be synced automatically via useEffect
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to remove category';
      setError(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  // Load category suggestions
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

  // Handle category input change with debouncing
  const handleCategoryInputChange = (value: string) => {
    setCategoryInputValue(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = window.setTimeout(() => {
      loadCategorySuggestions(value);
    }, 300);
  };

  // Handle category selection from suggestions
  const handleCategorySuggestionSelect = async (category: CategoryResponse) => {
    if (!roadmap) return;
    
    // Check if category is already added using roadmap.categories as source of truth
    const currentCategoryIds = extractCategoryIds(roadmap.categories || []);
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
      // Get current categories from the roadmap state, not selectedCategoryIds
      const newCategoryIds = [...currentCategoryIds, categoryId];
      

      
      const updated = await roadmapAPI.update(roadmap._id, {
        name: roadmap.name,
        roadmap: roadmap.roadmap,
        description: roadmap.description,
        category_ids: newCategoryIds
      });
      

      
      setRoadmap(updated);
      // Note: selectedCategoryIds will be synced automatically via useEffect
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

  // Handle creating new category
  const handleCreateNewCategory = async () => {
    if (!roadmap || !categoryInputValue.trim()) return;
    
    setCreatingCategory(true);
    setError('');
    try {
      
      // Create new category
      const newCategory = await categoryAPI.create({
        name: categoryInputValue.trim(),
        description: categoryInputValue.trim()
      });
      
      
      // Add to roadmap - preserve existing categories using roadmap.categories as source of truth
      const currentCategoryIds = extractCategoryIds(roadmap.categories || []);
      const newCategoryId = getCategoryId(newCategory);
      
      if (!newCategoryId) {
        console.error('Created category has no valid ID:', newCategory);
        setError('Failed to create category: Invalid ID returned');
        return;
      }
      
      const newCategoryIds = [...currentCategoryIds, newCategoryId];
      

      
      const updated = await roadmapAPI.update(roadmap._id, {
        name: roadmap.name,
        roadmap: roadmap.roadmap,
        description: roadmap.description,
        category_ids: newCategoryIds
      });
      

      
      setRoadmap(updated);
      // Note: selectedCategoryIds will be synced automatically via useEffect
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

  // Handle category input key press
  const handleCategoryInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (categorySuggestions.length > 0) {
        // Select first suggestion
        handleCategorySuggestionSelect(categorySuggestions[0]);
      } else {
        // Create new category
        handleCreateNewCategory();
      }
    } else if (e.key === 'Escape') {
      setCategoryInputValue('');
      setCategorySuggestions([]);
      setShowCategoryInput(false);
    }
  };

  // Focus input when shown
  useEffect(() => {
    if (showCategoryInput && categoryInputRef.current) {
      categoryInputRef.current.focus();
    }
  }, [showCategoryInput]);

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditMode) {
      // Exit edit mode - cancel any pending edits
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      setShowCategoryInput(false);
      setCategoryInputValue('');
      setCategorySuggestions([]);
      setEditedTitle(roadmap?.name || '');
      setEditedDescription(roadmap?.description || '');
    }
    setIsEditMode(!isEditMode);
  };

  const cancelTitleEdit = () => {
    setEditedTitle(roadmap?.name || '');
    setIsEditingTitle(false);
  };

  const cancelDescriptionEdit = () => {
    setEditedDescription(roadmap?.description || '');
    setIsEditingDescription(false);
  };

  // Start building
  const startBuilder = () => {
    setViewMode('builder');
  };

  // Go back to roadmaps list
  const goBackToList = () => {
    navigate('/roadmaps');
  };

  // Roadmap Builder View
  if (viewMode === 'builder' && roadmap) {
    // Additional security check - only allow admin users to access builder
    if (!isAdmin) {
      setViewMode('view');
      return null; // This will trigger a re-render in view mode
    }
    
    // Use roadmap.categories as source of truth instead of selectedCategoryIds
    const validCategoryIds = extractCategoryIds(roadmap.categories || []);
    
    return (
      <RoadmapBuilder
        initialData={roadmap.roadmap}
        onSave={handleRoadmapSave}
        readOnly={false}
        roadmapId={roadmap._id}
        authToken={tokenManager.getAccessToken() || undefined}
        name={roadmap.name}
        description={roadmap.description}
        categoryIds={validCategoryIds}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black py-8 relative overflow-hidden">
        {/* Background - minimal pulsing lights */}
        <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
          <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full animate-pulse-glow" style={{ backgroundColor: '#39FF14', filter: 'blur(60px)' }}></div>
          <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full animate-pulse-glow delay-1000" style={{ backgroundColor: '#39FF14', filter: 'blur(40px)' }}></div>
        </div>

        {/* Very subtle static grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md border border-neutral-700/20 p-8">
            <div className="text-center">
              <div className="inline-flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#39FF14' }}></div>
                <span className="text-neutral-300 text-lg">Loading roadmap...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !roadmap) {
    return (
      <div className="min-h-screen bg-black py-8 relative overflow-hidden">
        {/* Background - minimal pulsing lights */}
        <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
          <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full animate-pulse-glow" style={{ backgroundColor: '#39FF14', filter: 'blur(60px)' }}></div>
          <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full animate-pulse-glow delay-1000" style={{ backgroundColor: '#39FF14', filter: 'blur(40px)' }}></div>
        </div>

        {/* Very subtle static grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md border border-neutral-700/20 p-8">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-4">{String(error || 'Roadmap not found')}</div>
              <button
                onClick={goBackToList}
                className="px-6 py-2 text-black font-medium rounded-lg transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: '#39FF14' }}
              >
                Back to Roadmaps
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background - minimal pulsing lights */}
      <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
        <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full animate-pulse-glow" style={{ backgroundColor: '#39FF14', filter: 'blur(60px)' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full animate-pulse-glow delay-1000" style={{ backgroundColor: '#39FF14', filter: 'blur(40px)' }}></div>
      </div>

      {/* Very subtle static grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Header */}
      <div className="relative z-10 bg-neutral-900/40 backdrop-blur-md border-b border-neutral-700/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goBackToList}
              className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Roadmaps</span>
            </button>

            <div className="flex items-center space-x-3">
              {isAdmin && (
                <button
                  onClick={toggleEditMode}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isEditMode 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isEditMode ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    )}
                  </svg>
                  <span>{isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4 mt-4 text-red-200">
              {String(error)}
            </div>
          )}

          {/* Title Section */}
          <div className="mt-6">
            {isEditingTitle ? (
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 text-3xl font-bold bg-neutral-800/50 text-white border border-neutral-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Roadmap title..."
                  disabled={saving}
                />
                <button
                  onClick={handleTitleSave}
                  disabled={saving || !editedTitle.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelTitleEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-white">{roadmap.name}</h1>
                {isEditMode && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                    title="Edit title"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Roadmap Type (Special Category) */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-white">Roadmap Type</h2>
            </div>
            
            {isEditMode ? (
              <div className="space-y-2">
                <select
                  value={selectedSpecialCategory}
                  onChange={(e) => updateSpecialCategory(e.target.value)}
                  disabled={saving}
                  className="w-full md:w-auto px-4 py-2 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value={SPECIAL_CATEGORIES.SKILL_BASED}>Skill Based</option>
                  <option value={SPECIAL_CATEGORIES.ROLE_BASED}>Role Based</option>
                </select>
                <p className="text-xs text-neutral-400">
                  Choose whether this roadmap is skill-focused or role-experience focused
                </p>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {getCurrentSpecialCategory() === SPECIAL_CATEGORIES.SKILL_BASED ? (
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full text-sm font-medium">
                    Skill Based
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-full text-sm font-medium">
                    Role Based
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-white">Categories</h2>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              {roadmap.categories && roadmap.categories.filter(category => {
                const categoryId = getCategoryId(category);
                // Filter out special categories and invalid IDs
                return categoryId && 
                       categoryId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                       categoryId !== SPECIAL_CATEGORIES.ROLE_BASED;
              }).map((category) => {
                const categoryId = getCategoryId(category);
                if (!categoryId) return null; // Skip categories without valid IDs
                
                return (
                  <div
                    key={`category-${categoryId}`}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600/20 border border-green-400/30 text-green-300 rounded-full text-sm"
                  >
                    <span>{category.name}</span>
                    {isEditMode && (
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
              {isEditMode && (
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
                          // Only hide if not clicking on suggestions
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
                                e.preventDefault(); // Prevent input blur
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
                                e.preventDefault(); // Prevent input blur
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
              
              {roadmap.categories?.length === 0 && !showCategoryInput && (
                <p className="text-neutral-400 text-sm">No categories assigned</p>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-3">
              <h2 className="text-xl font-semibold text-white">Description</h2>
              {!isEditingDescription && isEditMode && (
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
                  placeholder="Roadmap description..."
                  disabled={saving}
                />
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDescriptionSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelDescriptionEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-neutral-300 leading-relaxed">
                {roadmap.description || 'No description provided.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Roadmap Visualization */}
      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Roadmap Preview:</h2>
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <button
                  onClick={startBuilder}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Roadmap</span>
                </button>
              )}
              {roadmap.roadmap && (() => {
                try {
                  JSON.parse(roadmap.roadmap);
                  return (
                    <button
                      onClick={() => navigate(`/roadmaps/${roadmap._id}/fullscreen`)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span>Open Fullscreen</span>
                    </button>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          </div>
          
          <div className="bg-neutral-800/40 rounded-lg border border-neutral-600/30 overflow-hidden" style={{ height: '600px' }}>
            {roadmap.roadmap && (() => {
              try {
                JSON.parse(roadmap.roadmap);
                // If it's valid JSON, show the visual roadmap
                return (
                  <RoadmapVisualization 
                    data={roadmap.roadmap}
                    className="w-full h-full"
                  />
                );
              } catch (error) {
                // If it's not JSON, show fallback message
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="max-w-md mx-auto px-4">
                      <div className="bg-yellow-900/40 border border-yellow-500/50 rounded-lg p-6 text-center">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                          <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-yellow-200 font-medium text-lg">Text-based Roadmap</span>
                        </div>
                        <p className="text-yellow-100 mb-4">
                          This roadmap is in text format. Create a visual version using the roadmap builder.
                        </p>
                        {isAdmin && (
                          <button
                            onClick={startBuilder}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>Create Visual Roadmap</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapDetail; 