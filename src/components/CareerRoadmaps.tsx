import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { roadmapAPI, categoryAPI, type RoadmapListItem, type RoadmapRequest, type CategoryResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type ViewMode = 'list' | 'create';

// Special category IDs that should be handled separately
const SPECIAL_CATEGORIES = {
  ROLE_BASED: '5717636e-6ff0-4a91-9cdb-678309c69514',
  SKILL_BASED: 'f8f2a743-2db7-4fc2-a77f-8ae7c2a8d99c'
} as const;

const CareerRoadmaps = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<RoadmapListItem[]>([]);
  const [roleBasedRoadmaps, setRoleBasedRoadmaps] = useState<RoadmapListItem[]>([]);
  const [skillBasedRoadmaps, setSkillBasedRoadmaps] = useState<RoadmapListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState<RoadmapRequest>({
    name: '',
    roadmap: '',
    description: ''
  });
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  // Special category selection for create/edit
  const [selectedSpecialCategory, setSelectedSpecialCategory] = useState<string>(SPECIAL_CATEGORIES.SKILL_BASED);

  // Add state for showing all items in each section
  const [showAllSkillBased, setShowAllSkillBased] = useState(false);
  const [showAllRoleBased, setShowAllRoleBased] = useState(false);

  // Check if user is admin
  const isAdmin = user?.user_role === 'admin';

  // Helper function to get category ID (handles both _id and id properties)
  const getCategoryId = (category: any): string | undefined => {
    return category._id || category.id;
  };

  // Helper function to check if a roadmap belongs to a special category
  const hasSpecialCategory = (roadmap: RoadmapListItem, categoryId: string): boolean => {
    return roadmap.categories?.some(cat => {
      const catId = getCategoryId(cat);
      return catId === categoryId;
    }) || false;
  };

  // Helper function to get the primary special category (skill-based takes precedence)
  const getPrimarySpecialCategory = (roadmap: RoadmapListItem): string | null => {
    if (hasSpecialCategory(roadmap, SPECIAL_CATEGORIES.SKILL_BASED)) {
      return SPECIAL_CATEGORIES.SKILL_BASED;
    }
    if (hasSpecialCategory(roadmap, SPECIAL_CATEGORIES.ROLE_BASED)) {
      return SPECIAL_CATEGORIES.ROLE_BASED;
    }
    return null;
  };

  // Load categories for filter dropdown (excluding special categories)
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await categoryAPI.getAll(1, 100); // Get more categories for filter
      // Filter out special categories from the dropdown
      const filteredCategories = response.items.filter(cat => {
        const catId = getCategoryId(cat);
        return catId !== SPECIAL_CATEGORIES.ROLE_BASED && 
               catId !== SPECIAL_CATEGORIES.SKILL_BASED;
      });
      setCategories(filteredCategories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load roadmaps with search and filter, then categorize them
  const loadRoadmaps = async (page: number = 1, search?: string, categoryId?: string) => {
    setLoading(true);
    setError('');
    try {
      // Load more items to ensure we have enough for each section
      const response = await roadmapAPI.getAll(page, 50, search, categoryId);
      const allRoadmaps = response.items;
      
      // Categorize roadmaps
      const roleBased: RoadmapListItem[] = [];
      const skillBased: RoadmapListItem[] = [];
      
      allRoadmaps.forEach(roadmap => {
        const primaryCategory = getPrimarySpecialCategory(roadmap);
        if (primaryCategory === SPECIAL_CATEGORIES.SKILL_BASED) {
          skillBased.push(roadmap);
        } else if (primaryCategory === SPECIAL_CATEGORIES.ROLE_BASED) {
          roleBased.push(roadmap);
        } else {
          // For roadmaps without special categories, assign to skill-based as default
          skillBased.push(roadmap);
        }
      });
      
      // Ensure minimum 6 items per section by redistributing if needed
      const minItemsPerSection = 6;
      
      // If one section has fewer than 6, try to balance
      if (roleBased.length < minItemsPerSection && skillBased.length > minItemsPerSection) {
        const toMove = Math.min(minItemsPerSection - roleBased.length, skillBased.length - minItemsPerSection);
        for (let i = 0; i < toMove; i++) {
          const item = skillBased.pop();
          if (item) roleBased.push(item);
        }
      } else if (skillBased.length < minItemsPerSection && roleBased.length > minItemsPerSection) {
        const toMove = Math.min(minItemsPerSection - skillBased.length, roleBased.length - minItemsPerSection);
        for (let i = 0; i < toMove; i++) {
          const item = roleBased.pop();
          if (item) skillBased.push(item);
        }
      }
      
      setRoleBasedRoadmaps(roleBased);
      setSkillBasedRoadmaps(skillBased);
      setRoadmaps(allRoadmaps); // Keep original for legacy compatibility
      setCurrentPage(response.page);
      setTotalPages(response.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load roadmaps');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = window.setTimeout(() => {
      loadRoadmaps(1, value, selectedCategoryId);
    }, 300);
  };

  // Handle category filter change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1); // Reset to first page when filtering
    loadRoadmaps(1, searchTerm, categoryId);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId('');
    setCurrentPage(1);
    loadRoadmaps(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadRoadmaps(page, searchTerm, selectedCategoryId);
  };

  useEffect(() => {
    loadRoadmaps();
    loadCategories();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create roadmap
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Automatically set the default roadmap content and include special category
      const roadmapData = {
        ...formData,
        roadmap: JSON.stringify({ blocks: [], connections: [] }),
        category_ids: [selectedSpecialCategory] // Include the selected special category
      };
      const created = await roadmapAPI.create(roadmapData);
      setFormData({ name: '', roadmap: '', description: '' });
      setSelectedSpecialCategory(SPECIAL_CATEGORIES.SKILL_BASED); // Reset to default
      setViewMode('list');
      loadRoadmaps(currentPage, searchTerm, selectedCategoryId);
      // Navigate to the newly created roadmap
      navigate(`/roadmaps/${created._id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create roadmap');
    } finally {
      setLoading(false);
    }
  };

  // View roadmap details - navigate to detail page
  const viewRoadmap = (roadmap: RoadmapListItem) => {
    navigate(`/roadmaps/${roadmap._id}`);
  };

  // Start creating
  const startCreate = () => {
    // Additional security check - only allow admin users to create roadmaps
    if (!isAdmin) {
      return;
    }
    setViewMode('create');
  };

  // Go back to list
  const goBackToList = () => {
    setViewMode('list');
    setFormData({ name: '', roadmap: '', description: '' });
  };

  // Helper function to truncate description to 40 characters
  const truncateDescription = (description: string, limit: number = 40): string => {
    if (description.length <= limit) return description;
    return description.substring(0, limit) + '...';
  };

  if (viewMode === 'create') {
    // Additional security check - only allow admin users to access create mode
    if (!isAdmin) {
      setViewMode('list');
      return null; // This will trigger a re-render in list mode
    }
    
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
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md border border-neutral-700/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">
                  Create New Roadmap
                </h1>
                <button
                  onClick={goBackToList}
                  className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </button>
              </div>

              {error && (
                <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4 mb-6 text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-2">Roadmap Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-neutral-800/30 backdrop-blur-sm border border-neutral-600/30 rounded-lg text-white focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': '#39FF14' } as React.CSSProperties}
                    placeholder="e.g., Frontend Developer Roadmap"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-neutral-800/30 backdrop-blur-sm border border-neutral-600/30 rounded-lg text-white focus:outline-none focus:ring-2 resize-none transition-all"
                    style={{ '--tw-ring-color': '#39FF14' } as React.CSSProperties}
                    rows={3}
                    placeholder="Brief description of what this roadmap covers"
                    required
                  />
                </div>

                {/* Special Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-2">Roadmap Type</label>
                  <select
                    value={selectedSpecialCategory}
                    onChange={(e) => setSelectedSpecialCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800/30 backdrop-blur-sm border border-neutral-600/30 rounded-lg text-white focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': '#39FF14' } as React.CSSProperties}
                    required
                  >
                    <option value={SPECIAL_CATEGORIES.SKILL_BASED}>Skill Based</option>
                    <option value={SPECIAL_CATEGORIES.ROLE_BASED}>Role Based</option>
                  </select>
                  <p className="text-xs text-neutral-400 mt-1">
                    Choose whether this roadmap is skill-focused or role-experience focused
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 text-black font-medium rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    style={{ backgroundColor: '#39FF14' }}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Create Roadmap</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={goBackToList}
                    className="px-6 py-3 bg-neutral-700/40 backdrop-blur-sm text-white rounded-lg hover:bg-neutral-600/40 border border-neutral-600/30 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 relative overflow-hidden">
      {/* Background - minimal pulsing lights */}
      <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
        <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full animate-pulse-glow" style={{ backgroundColor: '#39FF14', filter: 'blur(60px)' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full animate-pulse-glow delay-1000" style={{ backgroundColor: '#39FF14', filter: 'blur(40px)' }}></div>
      </div>

      {/* Very subtle static grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Single Section - Career Roadmaps */}
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md border border-neutral-700/20">
          <div className="p-4 sm:p-6">
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Career Roadmaps</h1>
                <p className="text-neutral-300 text-sm sm:text-base">Explore detailed career roadmaps for different specializations</p>
              </div>
              {isAdmin && (
                <button
                  onClick={startCreate}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 text-black font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto"
                  style={{ backgroundColor: '#39FF14' }}
                  disabled={loading}
                >
                  <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add New Roadmap</span>
                </button>
              )}
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 sm:h-5 w-4 sm:w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 bg-neutral-800/30 backdrop-blur-sm border border-neutral-600/30 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all text-sm sm:text-base"
                      style={{ '--tw-ring-color': '#39FF14' } as React.CSSProperties}
                      placeholder="Search roadmaps..."
                    />
                    {searchTerm && (
                      <button
                        onClick={() => handleSearchChange('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Filter and Clear Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 sm:max-w-xs">
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 bg-neutral-800/30 backdrop-blur-sm border border-neutral-600/30 rounded-lg text-white focus:outline-none focus:ring-2 transition-all text-sm sm:text-base"
                      style={{ '--tw-ring-color': '#39FF14' } as React.CSSProperties}
                      disabled={loadingCategories}
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  {(searchTerm || selectedCategoryId) && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 sm:py-3 bg-neutral-700/40 backdrop-blur-sm text-white rounded-lg hover:bg-neutral-600/40 border border-neutral-600/30 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base sm:w-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchTerm || selectedCategoryId) && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-neutral-400">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs bg-blue-600/20 border border-blue-400/30 text-blue-300">
                      Search: "{searchTerm.length > 20 ? searchTerm.substring(0, 20) + '...' : searchTerm}"
                      <button
                        onClick={() => handleSearchChange('')}
                        className="ml-1 sm:ml-2 text-blue-300 hover:text-blue-100"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {selectedCategoryId && (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs bg-green-600/20 border border-green-400/30 text-green-300">
                      Category: {categories.find(c => c._id === selectedCategoryId)?.name}
                      <button
                        onClick={() => handleCategoryChange('')}
                        className="ml-1 sm:ml-2 text-green-300 hover:text-green-100"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4 mb-6 text-red-200">
                {error}
              </div>
            )}
            
            {/* Loading State */}
            {loading && roadmaps.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#39FF14' }}></div>
                  <span className="text-neutral-300 text-lg">Loading roadmaps...</span>
                </div>
              </div>
            ) : roadmaps.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="w-12 sm:w-16 h-12 sm:h-16 text-neutral-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {(searchTerm || selectedCategoryId) ? (
                  <>
                    <p className="text-neutral-400 text-base sm:text-lg mb-4">No roadmaps found matching your filters</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={clearFilters}
                        className="px-4 sm:px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                      >
                        Clear Filters
                      </button>
                      {isAdmin && (
                        <button
                          onClick={startCreate}
                          className="px-4 sm:px-6 py-2 text-black font-medium rounded-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                          style={{ backgroundColor: '#39FF14' }}
                        >
                          Create New Roadmap
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-neutral-400 text-base sm:text-lg mb-4">No roadmaps available yet</p>
                    {isAdmin && (
                      <button
                        onClick={startCreate}
                        className="px-4 sm:px-6 py-2 text-black font-medium rounded-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                        style={{ backgroundColor: '#39FF14' }}
                      >
                        Create Your First Roadmap
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Skill-Based Roadmaps Section */}
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-8 bg-blue-500 rounded-full"></div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Skill-Based Roadmaps</h2>
                      <span className="px-2 sm:px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full text-xs sm:text-sm">
                        {skillBasedRoadmaps.length} roadmaps
                      </span>
                    </div>
                  </div>
                  
                  {skillBasedRoadmaps.length === 0 ? (
                    <div className="text-center py-8 bg-neutral-800/20 rounded-lg border border-neutral-700/30">
                      <p className="text-neutral-400">No skill-based roadmaps available yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {skillBasedRoadmaps.slice(0, showAllSkillBased ? skillBasedRoadmaps.length : 6).map((roadmap) => (
                        <div
                          key={`skill-${roadmap._id}`}
                          onClick={() => viewRoadmap(roadmap)}
                          className="bg-neutral-800/40 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-blue-400/30 hover:border-blue-400/70 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl group"
                          style={{ 
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {/* Type indicator */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded text-xs font-medium">
                              Skill-Based
                            </span>
                          </div>
                          
                          {/* Content */}
                          <h3 className="text-lg sm:text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">{roadmap.name}</h3>
                          <p className="text-neutral-300 text-sm mb-4 leading-relaxed">
                            {truncateDescription(roadmap.description)}
                          </p>
                          
                          {/* Categories (excluding special categories) */}
                          {roadmap.categories && roadmap.categories.filter(category => {
                            const categoryId = getCategoryId(category);
                            // Filter out special categories and invalid IDs
                            return categoryId && 
                                   categoryId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                   categoryId !== SPECIAL_CATEGORIES.ROLE_BASED;
                          }).length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-1">
                                {roadmap.categories.filter(cat => {
                                  const catId = getCategoryId(cat);
                                  return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                         catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                                }).slice(0, 2).map((category) => (
                                  <span
                                    key={getCategoryId(category)}
                                    className="px-2 py-1 bg-green-600/20 border border-green-400/30 text-green-300 rounded text-xs"
                                  >
                                    {category.name}
                                  </span>
                                ))}
                                {roadmap.categories.filter(cat => {
                                  const catId = getCategoryId(cat);
                                  return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                         catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                                }).length > 2 && (
                                  <span className="px-2 py-1 bg-neutral-600/20 border border-neutral-400/30 text-neutral-400 rounded text-xs">
                                    +{roadmap.categories.filter(cat => {
                                      const catId = getCategoryId(cat);
                                      return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                             catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                                    }).length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span className="hidden sm:inline">Updated {new Date(roadmap.updated_at).toLocaleDateString()}</span>
                            <span className="sm:hidden">Updated {new Date(roadmap.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <div className="flex items-center space-x-1 group-hover:text-blue-400 transition-colors">
                              <span className="hidden sm:inline">Click to view</span>
                              <span className="sm:hidden">View</span>
                              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Show more button for skill-based */}
                  {skillBasedRoadmaps.length > 6 && (
                    <div className="text-center mt-6">
                      <button 
                        onClick={() => setShowAllSkillBased(!showAllSkillBased)}
                        className="px-4 sm:px-6 py-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors text-sm sm:text-base"
                      >
                        {showAllSkillBased ? 'Show Less' : `View All ${skillBasedRoadmaps.length} Skill-Based Roadmaps`}
                      </button>
                    </div>
                  )}
                </div>

                {/* Role-Based Roadmaps Section */}
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-8 bg-purple-500 rounded-full"></div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Role-Based Roadmaps</h2>
                      <span className="px-2 sm:px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-full text-xs sm:text-sm">
                        {roleBasedRoadmaps.length} roadmaps
                      </span>
                    </div>
                  </div>
                  
                  {roleBasedRoadmaps.length === 0 ? (
                    <div className="text-center py-8 bg-neutral-800/20 rounded-lg border border-neutral-700/30">
                      <p className="text-neutral-400">No role-based roadmaps available yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {roleBasedRoadmaps.slice(0, showAllRoleBased ? roleBasedRoadmaps.length : 6).map((roadmap) => (
                        <div
                          key={`role-${roadmap._id}`}
                          onClick={() => viewRoadmap(roadmap)}
                          className="bg-neutral-800/40 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-purple-400/30 hover:border-purple-400/70 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl group"
                          style={{ 
                            boxShadow: '0 4px 20px rgba(168, 85, 247, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {/* Type indicator */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded text-xs font-medium">
                              Role-Based
                            </span>
                          </div>
                          
                          {/* Content */}
                          <h3 className="text-lg sm:text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">{roadmap.name}</h3>
                          <p className="text-neutral-300 text-sm mb-4 leading-relaxed">
                            {truncateDescription(roadmap.description)}
                          </p>
                          
                          {/* Categories (excluding special categories) */}
                          {roadmap.categories && roadmap.categories.filter(category => {
                            const categoryId = getCategoryId(category);
                            // Filter out special categories and invalid IDs
                            return categoryId && 
                                   categoryId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                   categoryId !== SPECIAL_CATEGORIES.ROLE_BASED;
                          }).length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-1">
                                {roadmap.categories.filter(cat => {
                                  const catId = getCategoryId(cat);
                                  return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                         catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                                }).slice(0, 2).map((category) => (
                                  <span
                                    key={getCategoryId(category)}
                                    className="px-2 py-1 bg-green-600/20 border border-green-400/30 text-green-300 rounded text-xs"
                                  >
                                    {category.name}
                                  </span>
                                ))}
                                {roadmap.categories.filter(cat => {
                                  const catId = getCategoryId(cat);
                                  return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                         catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                                }).length > 2 && (
                                  <span className="px-2 py-1 bg-neutral-600/20 border border-neutral-400/30 text-neutral-400 rounded text-xs">
                                    +{roadmap.categories.filter(cat => {
                                      const catId = getCategoryId(cat);
                                      return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                             catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                                    }).length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span className="hidden sm:inline">Updated {new Date(roadmap.updated_at).toLocaleDateString()}</span>
                            <span className="sm:hidden">Updated {new Date(roadmap.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <div className="flex items-center space-x-1 group-hover:text-purple-400 transition-colors">
                              <span className="hidden sm:inline">Click to view</span>
                              <span className="sm:hidden">View</span>
                              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Show more button for role-based */}
                  {roleBasedRoadmaps.length > 6 && (
                    <div className="text-center mt-6">
                      <button 
                        onClick={() => setShowAllRoleBased(!showAllRoleBased)}
                        className="px-4 sm:px-6 py-2 bg-purple-600/20 border border-purple-400/30 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors text-sm sm:text-base"
                      >
                        {showAllRoleBased ? 'Show Less' : `View All ${roleBasedRoadmaps.length} Role-Based Roadmaps`}
                      </button>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-neutral-700/30">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-neutral-700/40 backdrop-blur-sm text-white rounded-lg hover:bg-neutral-600/40 border border-neutral-600/30 disabled:opacity-50 transition-all duration-300 text-sm sm:text-base"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>
                    
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <span className="text-neutral-300 text-sm sm:text-base">
                        Page {currentPage} of {totalPages}
                      </span>
                      <span className="text-neutral-500 text-xs sm:text-sm">
                        ({skillBasedRoadmaps.length + roleBasedRoadmaps.length} items)
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-neutral-700/40 backdrop-blur-sm text-white rounded-lg hover:bg-neutral-600/40 border border-neutral-600/30 disabled:opacity-50 transition-all duration-300 text-sm sm:text-base"
                    >
                      <span>Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerRoadmaps; 