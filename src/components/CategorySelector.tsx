import React, { useState, useEffect, useRef } from 'react';
import { categoryAPI, type CategoryResponse } from '../services/api';

interface CategorySelectorProps {
  selectedCategoryIds: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClose: () => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryIds,
  onCategoryToggle,
  onClose
}) => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | undefined>(undefined);

  // Load categories function
  const loadCategories = async (pageNum: number = 1, search: string = '', reset: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await categoryAPI.getAll(pageNum, 20, search);
      
      if (reset) {
        setCategories(response.items);
      } else {
        setCategories(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.has_next);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadCategories(1, '', true);
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadCategories(1, searchTerm, true);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Handle infinite scroll
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadCategories(page + 1, searchTerm, false);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [loading, hasMore, page, searchTerm]);

  // Create new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setCreating(true);
    setError('');
    
    try {
      const newCategory = await categoryAPI.create({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || newCategoryName.trim()
      });
      
      // Add to the beginning of the list
      setCategories(prev => [newCategory, ...prev]);
      
      // Auto-select the new category
      onCategoryToggle(newCategory._id);
      
      // Reset form
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  // Check if we should show create option
  const shouldShowCreateOption = searchTerm.trim() && 
    !categories.some(cat => cat.name.toLowerCase() === searchTerm.toLowerCase()) &&
    !loading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Select Categories</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Categories List */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-2"
          style={{ maxHeight: '400px' }}
        >
          {/* Create New Category Option */}
          {shouldShowCreateOption && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
              {!showCreateForm ? (
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setNewCategoryName(searchTerm);
                    setNewCategoryDescription(searchTerm);
                  }}
                  className="w-full text-left flex items-center space-x-3 text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create new category: "{searchTerm}"</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter category name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter description..."
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCreateCategory}
                      disabled={creating || !newCategoryName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewCategoryName('');
                        setNewCategoryDescription('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing Categories */}
          {categories.map((category) => (
            <div
              key={category._id}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedCategoryIds.includes(category._id)
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => onCategoryToggle(category._id)}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                selectedCategoryIds.includes(category._id)
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300'
              }`}>
                {selectedCategoryIds.includes(category._id) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{category.name}</div>
                {category.description && category.description !== category.name && (
                  <div className="text-sm text-gray-500">{category.description}</div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading categories...</span>
            </div>
          )}

          {/* No more categories */}
          {!loading && !hasMore && categories.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No more categories to load
            </div>
          )}

          {/* No categories found */}
          {!loading && categories.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>No categories found for "{searchTerm}"</p>
              <p className="text-sm mt-1">Create a new category above</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'} selected
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySelector; 