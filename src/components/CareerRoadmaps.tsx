import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { roadmapAPI, categoryAPI, type RoadmapListItem, type RoadmapRequest, type CategoryResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type ViewMode = 'list' | 'create';

const CareerRoadmaps = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<RoadmapListItem[]>([]);
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

  // Check if user is admin
  const isAdmin = user?.user_role === 'admin';

  // Load categories for filter dropdown
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await categoryAPI.getAll(1, 100); // Get more categories for filter
      setCategories(response.items);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load roadmaps with search and filter
  const loadRoadmaps = async (page: number = 1, search?: string, categoryId?: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await roadmapAPI.getAll(page, 12, search, categoryId);
      setRoadmaps(response.items);
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
      // Automatically set the default roadmap content
      const roadmapData = {
        ...formData,
        roadmap: JSON.stringify({ blocks: [], connections: [] })
      };
      const created = await roadmapAPI.create(roadmapData);
      setFormData({ name: '', roadmap: '', description: '' });
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

  if (viewMode === 'create') {
    // Additional security check - only allow admin users to access create mode
    if (!isAdmin) {
      setViewMode('list');
      return null; // This will trigger a re-render in list mode
    }
    
    return (
      <div className="min-h-screen bg-black py-8 relative overflow-hidden">
        {/* Background animations */}
        <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
          <div className="absolute inset-0 bg-grid-pattern animate-grid-move"></div>
        </div>

        <div className="absolute inset-0 pointer-events-none" style={{ filter: 'blur(100px)' }}>
          {[...Array(20)].map((_, i) => (
            <div
              key={`create-float-${i}`}
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
              key={`create-float-slow-${i}`}
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
      {/* Background animations */}
      <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
        <div className="absolute inset-0 bg-grid-pattern animate-grid-move"></div>
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{ filter: 'blur(100px)' }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={`main-float-${i}`}
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
            key={`main-float-slow-${i}`}
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

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Single Section - Career Roadmaps */}
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md border border-neutral-700/20">
          <div className="p-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Career Roadmaps</h1>
                <p className="text-neutral-300">Explore detailed career roadmaps for different specializations</p>
              </div>
              {isAdmin && (
                <button
                  onClick={startCreate}
                  className="flex items-center space-x-2 px-6 py-3 text-black font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: '#39FF14' }}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add New Roadmap</span>
                </button>
              )}
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-800/30 backdrop-blur-sm border border-neutral-600/30 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all"
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

                {/* Category Filter */}
                <div className="sm:w-64">
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800/30 backdrop-blur-sm border border-neutral-600/30 rounded-lg text-white focus:outline-none focus:ring-2 transition-all"
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
                    className="px-4 py-3 bg-neutral-700/40 backdrop-blur-sm text-white rounded-lg hover:bg-neutral-600/40 border border-neutral-600/30 transition-all flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Active Filters Display */}
              {(searchTerm || selectedCategoryId) && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-neutral-400">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 border border-blue-400/30 text-blue-300">
                      Search: "{searchTerm}"
                      <button
                        onClick={() => handleSearchChange('')}
                        className="ml-2 text-blue-300 hover:text-blue-100"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {selectedCategoryId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-600/20 border border-green-400/30 text-green-300">
                      Category: {categories.find(c => c._id === selectedCategoryId)?.name}
                      <button
                        onClick={() => handleCategoryChange('')}
                        className="ml-2 text-green-300 hover:text-green-100"
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
                  <svg className="w-16 h-16 text-neutral-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {(searchTerm || selectedCategoryId) ? (
                  <>
                    <p className="text-neutral-400 text-lg mb-4">No roadmaps found matching your filters</p>
                    <button
                      onClick={clearFilters}
                      className="px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors mr-3"
                    >
                      Clear Filters
                    </button>
                    {isAdmin && (
                      <button
                        onClick={startCreate}
                        className="px-6 py-2 text-black font-medium rounded-lg transition-all duration-300 hover:scale-105"
                        style={{ backgroundColor: '#39FF14' }}
                      >
                        Create New Roadmap
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-neutral-400 text-lg mb-4">No roadmaps available yet</p>
                    {isAdmin && (
                      <button
                        onClick={startCreate}
                        className="px-6 py-2 text-black font-medium rounded-lg transition-all duration-300 hover:scale-105"
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
                {/* Roadmaps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {roadmaps.map((roadmap) => (
                    <div
                      key={roadmap._id}
                      onClick={() => viewRoadmap(roadmap)}
                      className="bg-neutral-800/40 backdrop-blur-sm rounded-lg p-6 border border-neutral-600/30 hover:border-green-400/50 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl group"
                      style={{ 
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Content */}
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">{roadmap.name}</h3>
                      <p className="text-neutral-300 text-sm mb-4 line-clamp-3 leading-relaxed">{roadmap.description}</p>
                      
                      {/* Categories */}
                      {roadmap.categories && roadmap.categories.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {roadmap.categories.slice(0, 3).map((category) => (
                              <span
                                key={category._id}
                                className="px-2 py-1 bg-green-600/20 border border-green-400/30 text-green-300 rounded text-xs"
                              >
                                {category.name}
                              </span>
                            ))}
                            {roadmap.categories.length > 3 && (
                              <span className="px-2 py-1 bg-neutral-600/20 border border-neutral-400/30 text-neutral-400 rounded text-xs">
                                +{roadmap.categories.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>Updated {new Date(roadmap.updated_at).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-1 group-hover:text-green-400 transition-colors">
                          <span>Click to view</span>
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 pt-4 border-t border-neutral-700/30">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-neutral-700/40 backdrop-blur-sm text-white rounded-lg hover:bg-neutral-600/40 border border-neutral-600/30 disabled:opacity-50 transition-all duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-neutral-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <span className="text-neutral-500 text-sm">
                        ({roadmaps.length} items)
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-neutral-700/40 backdrop-blur-sm text-white rounded-lg hover:bg-neutral-600/40 border border-neutral-600/30 disabled:opacity-50 transition-all duration-300"
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