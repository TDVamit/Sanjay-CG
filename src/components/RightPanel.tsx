import React, { useState } from 'react';
import type { RoadmapBlock } from '../types/roadmap';
import RichTextEditor from './RichTextEditor';

export interface RightPanelProps {
  block: RoadmapBlock;
  onUpdate: (updates: Partial<RoadmapBlock>) => void;
  onClose: () => void;
}

/*
 * Enhanced sidebar panel for editing block properties with improved UI and larger size
 */
const RightPanel: React.FC<RightPanelProps> = ({ block, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'style'>('content');

  // Prevent panel from closing when clicking inside
  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[500px] bg-white border-l shadow-xl z-40 flex flex-col" onClick={handlePanelClick}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Block Editor</h3>
            <p className="text-sm text-gray-600 mt-1">Customize your roadmap block</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'basic' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Basic</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'content' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Content</span>
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'style' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
            <span>Style</span>
          </button>
        </div>
      </div>

      {/* Body - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Title Section */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">Block Title</h4>
                </div>
                <input
                  type="text"
                  value={block.inner_label}
                  onChange={(e) => onUpdate({ inner_label: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter block title..."
                />
                <div className="mt-2 flex items-center space-x-2">
                  <label className="text-xs text-gray-500">Title Color</label>
                  <input
                    type="color"
                    value={block.titleColor || '#1F2937'}
                    onChange={e => onUpdate({ titleColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Border Section */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
                    <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">Block Border</h4>
                </div>
                <div className="flex items-center space-x-3 mb-2">
                  <label className="text-xs text-gray-500">Color</label>
                  <input
                    type="color"
                    value={block.borderColor || '#D1D5DB'}
                    onChange={e => onUpdate({ borderColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 rounded"
                  />
                  <label className="text-xs text-gray-500">Width</label>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    step="1"
                    value={typeof block.borderWidth === 'number' ? block.borderWidth : 2}
                    onChange={e => onUpdate({ borderWidth: Math.max(0, Number(e.target.value)) })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <label className="text-xs text-gray-500">Style</label>
                  <select
                    value={block.borderStyle || 'solid'}
                    onChange={e => onUpdate({ borderStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
              </div>

              {/* Category Section */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">Category</h4>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={block.outer_label}
                    onChange={(e) => onUpdate({ outer_label: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter category name..."
                  />
                  <select
                    value={block.outer_label_direction}
                    onChange={(e) =>
                      onUpdate({ outer_label_direction: e.target.value as 'up' | 'bottom' })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="up">Show Above Block</option>
                    <option value="bottom">Show Below Block</option>
                  </select>
                </div>
              </div>

              {/* Position & Size Section */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">Position & Size</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Position X</label>
                    <input
                      type="number"
                      value={block.x}
                      onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Position Y</label>
                    <input
                      type="number"
                      value={block.y}
                      onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Width</label>
                    <input
                      type="number"
                      value={block.width}
                      onChange={(e) =>
                        onUpdate({ width: Math.max(100, parseInt(e.target.value) || 100) })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Height</label>
                    <input
                      type="number"
                      value={block.height}
                      onChange={(e) =>
                        onUpdate({ height: Math.max(60, parseInt(e.target.value) || 60) })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="60"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-4">
              <RichTextEditor
                content={block.html_content}
                onChange={(html) => onUpdate({ html_content: html })}
              />
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-6">
              {/* Color Section */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">Background Color</h4>
                </div>
                <div className="flex space-x-3 mb-4">
                  <input
                    type="color"
                    value={block.color}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="w-16 h-12 border border-gray-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={block.color}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm transition-all duration-200"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Quick Colors */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-4">Quick Color Palette</h4>
                <div className="grid grid-cols-6 gap-3">
                  {[
                    { color: '#3B82F6', name: 'Blue' },
                    { color: '#10B981', name: 'Green' },
                    { color: '#F59E0B', name: 'Yellow' },
                    { color: '#EF4444', name: 'Red' },
                    { color: '#8B5CF6', name: 'Purple' },
                    { color: '#06B6D4', name: 'Cyan' },
                    { color: '#F97316', name: 'Orange' },
                    { color: '#84CC16', name: 'Lime' },
                    { color: '#EC4899', name: 'Pink' },
                    { color: '#6366F1', name: 'Indigo' },
                    { color: '#14B8A6', name: 'Teal' },
                    { color: '#F43F5E', name: 'Rose' }
                  ].map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => onUpdate({ color })}
                      className={`w-12 h-12 rounded-xl border-3 transition-all duration-200 hover:scale-110 ${
                        block.color === color ? 'border-gray-900 shadow-lg' : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightPanel; 