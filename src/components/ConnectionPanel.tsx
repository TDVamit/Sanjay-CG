import React from 'react';
import type { ConnectionStyle } from '../types/roadmap';

export interface ConnectionPanelProps {
  connectionId: string;
  fromBlockLabel: string;
  toBlockLabel: string;
  style: ConnectionStyle;
  onUpdate: (updates: Partial<ConnectionStyle>) => void;
  onClose: () => void;
  onDelete: () => void;
}

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ 
  connectionId, 
  fromBlockLabel, 
  toBlockLabel, 
  style, 
  onUpdate, 
  onClose,
  onDelete 
}) => {
  // Prevent panel from closing when clicking inside
  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[500px] bg-white border-l shadow-xl z-40 flex flex-col" onClick={handlePanelClick}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Connection Editor</h3>
            <p className="text-sm text-gray-600 mt-1">
              {fromBlockLabel} → {toBlockLabel}
            </p>
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
      </div>

      {/* Body - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Color Section */}
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
              <h4 className="font-semibold text-gray-900">Connection Color</h4>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={style.color}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-16 h-12 border border-gray-200 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={style.color}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm transition-all duration-200"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Thickness Section */}
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              <h4 className="font-semibold text-gray-900">Line Thickness</h4>
              <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">{style.weight}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={style.weight}
              onChange={(e) => onUpdate({ weight: parseInt(e.target.value) })}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Thin (1px)</span>
              <span>Thick (10px)</span>
            </div>
          </div>

          {/* Line Style Section */}
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <h4 className="font-semibold text-gray-900">Line Style</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['solid', 'dashed', 'dotted'] as const).map((lineStyle) => (
                <button
                  key={lineStyle}
                  onClick={() => onUpdate({ style: lineStyle })}
                  className={`p-4 border-2 rounded-xl text-sm capitalize transition-all duration-200 hover:scale-105 ${
                    style.style === lineStyle
                      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div 
                      className="w-10 h-1 bg-gray-600 rounded"
                      style={{
                        borderTop: lineStyle === 'solid' ? '3px solid' : 
                                  lineStyle === 'dashed' ? '3px dashed' : '3px dotted'
                      }}
                    />
                    <span className="font-medium">{lineStyle}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dash Gap - only show for dashed/dotted */}
          {(style.style === 'dashed' || style.style === 'dotted') && (
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h4m0 0h4m0 0h4m0 0h4" />
                </svg>
                <h4 className="font-semibold text-gray-900">Gap Size</h4>
                <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">{style.dashGap || 1}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={style.dashGap || 1}
                onChange={(e) => onUpdate({ dashGap: parseFloat(e.target.value) })}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Tight (1x)</span>
                <span>Wide (5x)</span>
              </div>
            </div>
          )}

          {/* Connection Shape Section */}
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h4 className="font-semibold text-gray-900">Connection Shape</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['curved', 'straight', 'orthogonal'] as const).map((curveStyle) => (
                <button
                  key={curveStyle}
                  onClick={() => onUpdate({ curve: curveStyle })}
                  className={`p-4 border-2 rounded-xl text-sm capitalize transition-all duration-200 hover:scale-105 ${
                    style.curve === curveStyle
                      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <svg className="w-10 h-8" viewBox="0 0 40 32" fill="none">
                      {curveStyle === 'curved' ? (
                        <path d="M6 26 Q20 6 34 26" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                      ) : curveStyle === 'orthogonal' ? (
                        <path d="M6 26 L6 16 Q6 12 10 12 L30 12 Q34 12 34 16 L34 26" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                      ) : (
                        <line x1="6" y1="26" x2="34" y2="6" stroke="currentColor" strokeWidth="2.5"/>
                      )}
                    </svg>
                    <span className="font-medium">{curveStyle}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Live Preview</h4>
                <p className="text-sm text-gray-600">See how your connection will look</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <svg className="w-full h-16" viewBox="0 0 240 64">
                <path
                  d={
                    style.curve === 'curved' 
                      ? "M24 48 Q120 16 216 48"
                      : style.curve === 'orthogonal'
                      ? "M24 48 L144 48 Q152 48 152 40 L152 16"
                      : "M24 48 L216 16"
                  }
                  stroke={style.color}
                  strokeWidth={style.weight}
                  strokeDasharray={
                    style.style === 'dashed' ? `${style.weight * 2},${style.weight * (style.dashGap || 1)}` :
                    style.style === 'dotted' ? `${style.weight * 0.5},${style.weight * 0.75 * (style.dashGap || 1)}` : 'none'
                  }
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Delete Connection Section */}
          <div className="bg-red-50 rounded-xl p-5 border border-red-100">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h4 className="font-semibold text-gray-900">Danger Zone</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Permanently remove this connection from your roadmap.
            </p>
            <button
              onClick={onDelete}
              className="w-full px-4 py-3 text-sm font-semibold text-red-700 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete Connection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel; 