import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  error?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  loading = false,
  className = "",
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option
  const selectedOption = options.find(option => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle option selection
  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          event.preventDefault();
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'ArrowDown':
        if (!isOpen) {
          event.preventDefault();
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        break;
    }
  };

  // Handle search input
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle search input key down
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (event.key === 'Enter' && filteredOptions.length > 0) {
      event.preventDefault();
      handleOptionSelect(filteredOptions[0].value);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className={`w-full px-4 py-2 sm:py-3 bg-neutral-800/30 backdrop-blur-sm border rounded-lg text-white focus:outline-none focus:ring-2 transition-all text-sm sm:text-base flex items-center justify-between ${
          error
            ? 'border-red-500 focus:ring-red-400'
            : 'border-neutral-600/30 focus:ring-opacity-50'
        } ${
          disabled || loading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-neutral-500/50 cursor-pointer'
        }`}
        style={!error ? { '--tw-ring-color': '#39FF14' } as React.CSSProperties : {}}
      >
        <span className={selectedOption ? 'text-white' : 'text-neutral-400'}>
          {loading ? 'Loading...' : selectedOption?.label || placeholder}
        </span>
        
        <div className="flex items-center space-x-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#39FF14' }}></div>
          )}
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800/90 backdrop-blur-md border border-neutral-600/30 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden">
          {/* Search Input */}
          {options.length > 5 && (
            <div className="p-3 border-b border-neutral-600/30">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search options..."
                  className="w-full px-3 py-2 bg-neutral-700/50 border border-neutral-600/30 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 text-sm"
                  style={{ '--tw-ring-color': '#39FF14' } as React.CSSProperties}
                />
                <svg
                  className="absolute right-3 top-2.5 w-4 h-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-neutral-400 text-sm text-center">
                {searchTerm ? 'No options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => !option.disabled && handleOptionSelect(option.value)}
                  disabled={option.disabled}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                    option.value === value
                      ? 'bg-green-600/20 text-green-300 border-l-2 border-green-400'
                      : option.disabled
                      ? 'text-neutral-500 cursor-not-allowed'
                      : 'text-white hover:bg-neutral-700/50'
                  } ${
                    !option.disabled ? 'hover:bg-neutral-700/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {option.value === value && (
                      <svg
                        className="w-4 h-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Clear Option (if value is selected and not required) */}
          {value && (
            <div className="border-t border-neutral-600/30">
              <button
                onClick={() => handleOptionSelect('')}
                className="w-full px-4 py-3 text-left text-sm text-neutral-400 hover:bg-neutral-700/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear selection</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown; 