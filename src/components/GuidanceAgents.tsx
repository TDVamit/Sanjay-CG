import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { guidanceAgentAPI, categoryAPI, type GuidanceAgentResponse, type CategoryResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CustomDropdown from './CustomDropdown';

type ViewMode = 'list' | 'create' | 'edit';

// Special category IDs that should be handled separately
const SPECIAL_CATEGORIES = {
  ROLE_BASED: '5717636e-6ff0-4a91-9cdb-678309c69514',
  SKILL_BASED: 'f8f2a743-2db7-4fc2-a77f-8ae7c2a8d99c'
} as const;

interface GuidanceAgentFormData {
  name: string;
  description: string;
  link: string;
  category_ids: string[];
  profile_pic?: File | null;
}

const GuidanceAgents: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<GuidanceAgentResponse[]>([]);
  const [roleBasedAgents, setRoleBasedAgents] = useState<GuidanceAgentResponse[]>([]);
  const [skillBasedAgents, setSkillBasedAgents] = useState<GuidanceAgentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [formData, setFormData] = useState<GuidanceAgentFormData>({
    name: '',
    description: '',
    link: '',
    category_ids: [],
    profile_pic: undefined
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
  
  // Special category selection for create/edit
  const [selectedSpecialCategory, setSelectedSpecialCategory] = useState<string>(SPECIAL_CATEGORIES.SKILL_BASED);
  
  // Add state for showing all items in each section
  const [showAllSkillBased, setShowAllSkillBased] = useState(false);
  const [showAllRoleBased, setShowAllRoleBased] = useState(false);
  
  const { user } = useAuth();
  const isAdmin = user?.user_role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get category ID (handles both _id and id properties)
  const getCategoryId = (category: any): string | undefined => {
    return category._id || category.id;
  };

  // Helper function to truncate description to 40 characters
  const truncateDescription = (description: string, limit: number = 40): string => {
    if (description.length <= limit) return description;
    return description.substring(0, limit) + '...';
  };

  // Helper function to check if an agent belongs to a special category
  const hasSpecialCategory = (agent: GuidanceAgentResponse, categoryId: string): boolean => {
    return agent.categories?.some(cat => {
      const catId = getCategoryId(cat);
      return catId === categoryId;
    }) || false;
  };

  // Helper function to get the primary special category (skill-based takes precedence)
  const getPrimarySpecialCategory = (agent: GuidanceAgentResponse): string | null => {
    if (hasSpecialCategory(agent, SPECIAL_CATEGORIES.SKILL_BASED)) {
      return SPECIAL_CATEGORIES.SKILL_BASED;
    }
    if (hasSpecialCategory(agent, SPECIAL_CATEGORIES.ROLE_BASED)) {
      return SPECIAL_CATEGORIES.ROLE_BASED;
    }
    return null;
  };

  // Load agents and categorize them
  const loadAgents = async (page: number = 1, search?: string, categoryId?: string) => {
    try {
      setLoading(true);
      // Load more items to ensure we have enough for each section
      const response = await guidanceAgentAPI.getAll(page, 50, search, categoryId);
      const allAgents = response.items;
      
      // Categorize agents
      const roleBased: GuidanceAgentResponse[] = [];
      const skillBased: GuidanceAgentResponse[] = [];
      
      allAgents.forEach(agent => {
        const primaryCategory = getPrimarySpecialCategory(agent);
        if (primaryCategory === SPECIAL_CATEGORIES.SKILL_BASED) {
          skillBased.push(agent);
        } else if (primaryCategory === SPECIAL_CATEGORIES.ROLE_BASED) {
          roleBased.push(agent);
        } else {
          // For agents without special categories, assign to skill-based as default
          skillBased.push(agent);
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
      
      setRoleBasedAgents(roleBased);
      setSkillBasedAgents(skillBased);
      setAgents(allAgents); // Keep original for legacy compatibility
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load guidance agents');
    } finally {
      setLoading(false);
    }
  };

  // Load categories (excluding special categories)
  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll(1, 100);
      // Filter out special categories from the dropdown
      const filteredCategories = response.items.filter(cat => {
        const catId = getCategoryId(cat);
        return catId !== SPECIAL_CATEGORIES.ROLE_BASED && 
               catId !== SPECIAL_CATEGORIES.SKILL_BASED;
      });
      setCategories(filteredCategories);
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

      // Include the selected special category in the form data
      const submissionData = {
        ...formData,
        category_ids: [...formData.category_ids, selectedSpecialCategory]
      };

      if (viewMode === 'create') {
        await guidanceAgentAPI.create(submissionData, profilePic || undefined);
      } else if (viewMode === 'edit' && editingAgent) {
        await guidanceAgentAPI.update(editingAgent._id, submissionData, profilePic || undefined);
      }

      // Reset form and go back to list
      setFormData({ name: '', description: '', link: '', category_ids: [], profile_pic: undefined });
      setSelectedSpecialCategory(SPECIAL_CATEGORIES.SKILL_BASED); // Reset to default
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
    // Filter out special categories from the regular category IDs
    const regularCategoryIds = agent.categories
      .filter(cat => {
        const catId = getCategoryId(cat);
        return catId !== SPECIAL_CATEGORIES.SKILL_BASED && catId !== SPECIAL_CATEGORIES.ROLE_BASED;
      })
      .map(cat => getCategoryId(cat))
      .filter((id): id is string => id !== undefined);
    
    setFormData({
      name: agent.name,
      description: agent.description,
      link: agent.link,
      category_ids: regularCategoryIds,
      profile_pic: undefined
    });
    
    // Set the current special category
    const currentSpecialCategory = getPrimarySpecialCategory(agent) || SPECIAL_CATEGORIES.SKILL_BASED;
    setSelectedSpecialCategory(currentSpecialCategory);
    
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
              setFormData({ name: '', description: '', link: '', category_ids: [], profile_pic: undefined });
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

          {/* Agent Type (Special Category) */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Agent Type *
            </label>
            <CustomDropdown
              value={selectedSpecialCategory}
              onChange={(value) => setSelectedSpecialCategory(value)}
              options={[
                { value: SPECIAL_CATEGORIES.SKILL_BASED, label: 'Skill Based' },
                { value: SPECIAL_CATEGORIES.ROLE_BASED, label: 'Role Based' }
              ]}
              placeholder="Select agent type"
              className="w-full"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Choose whether this agent is skill-focused or role-experience focused
            </p>
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
                setFormData({ name: '', description: '', link: '', category_ids: [], profile_pic: undefined });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Guidance Agents</h2>
        {isAdmin && (
          <button
            onClick={() => setViewMode('create')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Agent</span>
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSearch} className="w-full">
          <div className="flex">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search agents..."
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-l-lg text-white placeholder-neutral-400 focus:outline-none focus:border-green-400 text-sm sm:text-base"
            />
            <button
              type="submit"
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              Search
            </button>
          </div>
        </form>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 sm:max-w-xs">
            <CustomDropdown
              value={selectedCategoryId}
              onChange={handleCategoryFilter}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(category => ({
                  value: category._id,
                  label: category.name
                }))
              ]}
              placeholder="All Categories"
              loading={loading}
              disabled={loading}
            />
          </div>
          
          {(searchTerm || selectedCategoryId) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategoryId('');
                loadAgents(1);
              }}
              className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b border-green-400"></div>
            <span className="text-neutral-300 text-lg">Loading agents...</span>
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-neutral-400 text-lg sm:text-xl mb-4">No guidance agents found</p>
          {isAdmin && (
            <button
              onClick={() => setViewMode('create')}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              Create Your First Agent
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Skill-Based Agents Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-8 bg-blue-500 rounded-full"></div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Skill-Based Agents</h2>
                <span className="px-2 sm:px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full text-xs sm:text-sm">
                  {skillBasedAgents.length} agents
                </span>
              </div>
            </div>
            
            {skillBasedAgents.length === 0 ? (
              <div className="text-center py-8 bg-neutral-800/20 rounded-lg border border-neutral-700/30">
                <p className="text-neutral-400">No skill-based agents available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {skillBasedAgents.slice(0, showAllSkillBased ? skillBasedAgents.length : 6).map(agent => (
                  <div 
                    key={`skill-${agent._id}`} 
                    className="bg-neutral-900/60 backdrop-blur-md border border-blue-400/30 rounded-lg p-4 sm:p-6 hover:border-blue-400/70 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
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
                    
                    <div 
                      className="flex items-start space-x-4 mb-4 cursor-pointer"
                      onClick={() => viewAgent(agent)}
                    >
                      {agent.profile_pic ? (
                        <img
                          src={`data:image/jpeg;base64,${agent.profile_pic}`}
                          alt={agent.name}
                          className="w-10 sm:w-12 h-10 sm:h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 sm:w-6 h-5 sm:h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">{agent.name}</h3>
                        <p className="text-neutral-400 text-sm">
                          {truncateDescription(agent.description)}
                        </p>
                      </div>
                    </div>

                    {/* Categories (excluding special categories) */}
                    {agent.categories.filter(cat => {
                      const catId = getCategoryId(cat);
                      return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                             catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                    }).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {agent.categories.filter(cat => {
                          const catId = getCategoryId(cat);
                          return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                 catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                        }).slice(0, 2).map(category => (
                          <span
                            key={getCategoryId(category)}
                            className="px-2 py-1 bg-green-400/20 text-green-300 text-xs rounded-full"
                          >
                            {category.name}
                          </span>
                        ))}
                        {agent.categories.filter(cat => {
                          const catId = getCategoryId(cat);
                          return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                 catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                        }).length > 2 && (
                          <span className="px-2 py-1 bg-neutral-600/20 border border-neutral-400/30 text-neutral-400 rounded text-xs">
                            +{agent.categories.filter(cat => {
                              const catId = getCategoryId(cat);
                              return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                     catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                            }).length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <a
                        href={agent.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                      >
                        <span>Visit</span>
                        <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>

                      {isAdmin && (
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(agent);
                            }}
                            className="p-1.5 sm:p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                            title="Edit Agent"
                          >
                            <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(agent);
                            }}
                            className="p-1.5 sm:p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="Delete Agent"
                          >
                            <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            
            {/* Show more button for skill-based */}
            {skillBasedAgents.length > 6 && (
              <div className="text-center mt-6">
                <button 
                  onClick={() => setShowAllSkillBased(!showAllSkillBased)}
                  className="px-4 sm:px-6 py-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors text-sm sm:text-base"
                >
                  {showAllSkillBased ? 'Show Less' : `View All ${skillBasedAgents.length} Skill-Based Agents`}
                </button>
              </div>
            )}
          </div>

          {/* Role-Based Agents Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-8 bg-purple-500 rounded-full"></div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Role-Based Agents</h2>
                <span className="px-2 sm:px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-full text-xs sm:text-sm">
                  {roleBasedAgents.length} agents
                </span>
              </div>
            </div>
            
            {roleBasedAgents.length === 0 ? (
              <div className="text-center py-8 bg-neutral-800/20 rounded-lg border border-neutral-700/30">
                <p className="text-neutral-400">No role-based agents available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {roleBasedAgents.slice(0, showAllRoleBased ? roleBasedAgents.length : 6).map(agent => (
                  <div 
                    key={`role-${agent._id}`} 
                    className="bg-neutral-900/60 backdrop-blur-md border border-purple-400/30 rounded-lg p-4 sm:p-6 hover:border-purple-400/70 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
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
                    
                    <div 
                      className="flex items-start space-x-4 mb-4 cursor-pointer"
                      onClick={() => viewAgent(agent)}
                    >
                      {agent.profile_pic ? (
                        <img
                          src={`data:image/jpeg;base64,${agent.profile_pic}`}
                          alt={agent.name}
                          className="w-10 sm:w-12 h-10 sm:h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 sm:w-6 h-5 sm:h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors line-clamp-2">{agent.name}</h3>
                        <p className="text-neutral-400 text-sm">
                          {truncateDescription(agent.description)}
                        </p>
                      </div>
                    </div>

                    {/* Categories (excluding special categories) */}
                    {agent.categories.filter(cat => {
                      const catId = getCategoryId(cat);
                      return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                             catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                    }).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {agent.categories.filter(cat => {
                          const catId = getCategoryId(cat);
                          return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                 catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                        }).slice(0, 2).map(category => (
                          <span
                            key={getCategoryId(category)}
                            className="px-2 py-1 bg-green-400/20 text-green-300 text-xs rounded-full"
                          >
                            {category.name}
                          </span>
                        ))}
                        {agent.categories.filter(cat => {
                          const catId = getCategoryId(cat);
                          return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                 catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                        }).length > 2 && (
                          <span className="px-2 py-1 bg-neutral-600/20 border border-neutral-400/30 text-neutral-400 rounded text-xs">
                            +{agent.categories.filter(cat => {
                              const catId = getCategoryId(cat);
                              return catId !== SPECIAL_CATEGORIES.SKILL_BASED && 
                                     catId !== SPECIAL_CATEGORIES.ROLE_BASED;
                            }).length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <a
                        href={agent.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm"
                      >
                        <span>Visit</span>
                        <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>

                      {isAdmin && (
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(agent);
                            }}
                            className="p-1.5 sm:p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                            title="Edit Agent"
                          >
                            <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(agent);
                            }}
                            className="p-1.5 sm:p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="Delete Agent"
                          >
                            <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            
            {/* Show more button for role-based */}
            {roleBasedAgents.length > 6 && (
              <div className="text-center mt-6">
                <button 
                  onClick={() => setShowAllRoleBased(!showAllRoleBased)}
                  className="px-4 sm:px-6 py-2 bg-purple-600/20 border border-purple-400/30 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors text-sm sm:text-base"
                >
                  {showAllRoleBased ? 'Show Less' : `View All ${roleBasedAgents.length} Role-Based Agents`}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-full sm:w-auto px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Previous
          </button>
          
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 sm:pb-0">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base flex-shrink-0 ${
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
            className="w-full sm:w-auto px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default GuidanceAgents; 