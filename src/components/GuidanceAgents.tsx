import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { guidanceAgentAPI, categoryAPI, type GuidanceAgentResponse, type CategoryResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type ViewMode = 'list' | 'create' | 'edit';

interface GuidanceAgentFormData {
  name: string;
  description: string;
  link: string;
  category_ids: string[];
}

const GuidanceAgents: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<GuidanceAgentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [formData, setFormData] = useState<GuidanceAgentFormData>({
    name: '',
    description: '',
    link: '',
    category_ids: []
  });
  const [editingAgent, setEditingAgent] = useState<GuidanceAgentResponse | null>(null);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>('');
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  // Categories - simplified like roadmaps
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState<CategoryResponse[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | undefined>(undefined);
  
  const { user } = useAuth();
  const isAdmin = user?.user_role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions
  const getCategoryId = (category: any): string | undefined => {
    return category._id || category.id;
  };

  const extractCategoryIds = (categories: any[]): string[] => {
    return categories?.map(cat => getCategoryId(cat)).filter((id): id is string => id !== undefined && id !== null && id !== '') || [];
  };

  // Load agents
  const loadAgents = async (page: number = 1, search?: string, categoryId?: string) => {
    try {
      setLoading(true);
      const response = await guidanceAgentAPI.getAll(page, 10, search, categoryId);
      setAgents(response.items);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load guidance agents');
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll(1, 100);
      setCategories(response.items);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    loadAgents();
    loadCategories();
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAgents(1, searchTerm, selectedCategoryId);
  };

  // Handle category filter
  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    loadAgents(1, searchTerm, categoryId);
  };

  // Handle profile picture selection
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Category management like roadmaps
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

  const handleCategorySuggestionSelect = (category: CategoryResponse) => {
    const categoryId = getCategoryId(category);
    
    if (!categoryId || formData.category_ids.includes(categoryId)) {
      setCategoryInputValue('');
      setCategorySuggestions([]);
      setShowCategoryInput(false);
      return;
    }

    setFormData(prev => ({
      ...prev,
      category_ids: [...prev.category_ids, categoryId]
    }));
    setCategoryInputValue('');
    setCategorySuggestions([]);
    setShowCategoryInput(false);
  };

  const handleCreateNewCategory = async () => {
    if (!categoryInputValue.trim()) return;
    
    setCreatingCategory(true);
    setError('');
    try {
      const newCategory = await categoryAPI.create({
        name: categoryInputValue.trim(),
        description: categoryInputValue.trim()
      });
      
      const newCategoryId = getCategoryId(newCategory);
      
      if (!newCategoryId) {
        console.error('Created category has no valid ID:', newCategory);
        setError('Failed to create category: Invalid ID returned');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        category_ids: [...prev.category_ids, newCategoryId]
      }));
      setCategoryInputValue('');
      setCategorySuggestions([]);
      setShowCategoryInput(false);
      
      // Reload categories
      loadCategories();
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

  const handleCategoryRemove = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.filter(id => id !== categoryId)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.link.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (viewMode === 'create') {
        await guidanceAgentAPI.create(formData, profilePic || undefined);
      } else if (viewMode === 'edit' && editingAgent) {
        await guidanceAgentAPI.update(editingAgent._id, formData, profilePic || undefined);
      }

      // Reset form and go back to list
      setFormData({ name: '', description: '', link: '', category_ids: [] });
      setProfilePic(null);
      setProfilePicPreview('');
      setEditingAgent(null);
      setViewMode('list');
      loadAgents(currentPage, searchTerm, selectedCategoryId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save guidance agent');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (agent: GuidanceAgentResponse) => {
    setFormData({
      name: agent.name,
      description: agent.description,
      link: agent.link,
      category_ids: agent.categories.map(cat => cat._id)
    });
    setEditingAgent(agent);
    setProfilePicPreview(agent.profile_pic ? `data:image/jpeg;base64,${agent.profile_pic}` : '');
    setViewMode('edit');
  };

  // Handle delete
  const handleDelete = async (agent: GuidanceAgentResponse) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await guidanceAgentAPI.delete(agent._id);
      loadAgents(currentPage, searchTerm, selectedCategoryId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete guidance agent');
    } finally {
      setLoading(false);
    }
  };

  // View agent details
  const viewAgent = (agent: GuidanceAgentResponse) => {
    navigate(`/guidance-agents/${agent._id}`);
  };

  // Pagination
  const handlePageChange = (page: number) => {
    loadAgents(page, searchTerm, selectedCategoryId);
  };

  // Focus input when shown
  useEffect(() => {
    if (showCategoryInput && categoryInputRef.current) {
      categoryInputRef.current.focus();
    }
  }, [showCategoryInput]);

  // Create/Edit Form
  if (viewMode === 'create' || viewMode === 'edit') {
    if (!isAdmin && viewMode === 'create') {
      setViewMode('list');
      return null;
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {viewMode === 'create' ? 'Create Guidance Agent' : 'Edit Guidance Agent'}
          </h2>
          <button
            onClick={() => {
              setViewMode('list');
              setFormData({ name: '', description: '', link: '', category_ids: [] });
              setProfilePic(null);
              setProfilePicPreview('');
              setEditingAgent(null);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to List
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-green-400"
                placeholder="Agent name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Link *
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-green-400"
                placeholder="https://example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-green-400"
              placeholder="Describe this guidance agent..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              {profilePicPreview && (
                <img
                  src={profilePicPreview}
                  alt="Profile preview"
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {profilePicPreview ? 'Change Picture' : 'Upload Picture'}
                </button>
                {profilePicPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfilePic(null);
                      setProfilePicPreview('');
                    }}
                    className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Categories Section - like roadmaps */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Categories
            </label>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {formData.category_ids.map((categoryId) => {
                const category = categories.find(cat => getCategoryId(cat) === categoryId);
                if (!category) return null;
                
                return (
                  <div
                    key={categoryId}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600/20 border border-green-400/30 text-green-300 rounded-full text-sm"
                  >
                    <span>{category.name}</span>
                    <button
                      type="button"
                      onClick={() => handleCategoryRemove(categoryId)}
                      className="ml-1 text-green-300 hover:text-red-300 transition-colors"
                      title="Remove category"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
              
              {/* Add Category Button */}
              <div className="relative">
                {!showCategoryInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCategoryInput(true)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600/20 border border-blue-400/30 text-blue-300 rounded-full text-sm hover:bg-blue-600/30 transition-colors"
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
                            type="button"
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
                            type="button"
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
              
              {formData.category_ids.length === 0 && !showCategoryInput && (
                <p className="text-neutral-400 text-sm">No categories assigned</p>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (viewMode === 'create' ? 'Create Agent' : 'Update Agent')}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setFormData({ name: '', description: '', link: '', category_ids: [] });
                setProfilePic(null);
                setProfilePicPreview('');
                setEditingAgent(null);
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Guidance Agents</h2>
        {isAdmin && (
          <button
            onClick={() => setViewMode('create')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Agent</span>
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="flex">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search agents..."
              className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-l-lg text-white placeholder-neutral-400 focus:outline-none focus:border-green-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
        
        <select
          value={selectedCategoryId}
          onChange={(e) => handleCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-green-400"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <span className="text-neutral-300 text-lg">Loading agents...</span>
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-neutral-400 text-xl mb-4">No guidance agents found</p>
          {isAdmin && (
            <button
              onClick={() => setViewMode('create')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Your First Agent
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map(agent => (
            <div key={agent._id} className="bg-neutral-900/60 backdrop-blur-md border border-neutral-700/50 rounded-lg p-6 hover:border-green-400/30 transition-colors">
              <div 
                className="flex items-start space-x-4 mb-4 cursor-pointer"
                onClick={() => viewAgent(agent)}
              >
                {agent.profile_pic ? (
                  <img
                    src={`data:image/jpeg;base64,${agent.profile_pic}`}
                    alt={agent.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 hover:text-green-300 transition-colors">{agent.name}</h3>
                  <p className="text-neutral-400 text-sm line-clamp-2">{agent.description}</p>
                </div>
              </div>

              {agent.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.categories.map(category => (
                    <span
                      key={category._id}
                      className="px-2 py-1 bg-green-400/20 text-green-300 text-xs rounded-full"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <a
                  href={agent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <span>Visit</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                {isAdmin && (
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(agent);
                      }}
                      className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      title="Edit Agent"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(agent);
                      }}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete Agent"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    page === currentPage
                      ? 'bg-green-600 text-white'
                      : 'bg-neutral-800 text-white hover:bg-neutral-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default GuidanceAgents; 