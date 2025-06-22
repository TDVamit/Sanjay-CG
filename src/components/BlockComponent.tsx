import React, { useState, useCallback } from 'react';
import type { RoadmapBlock } from '../types/roadmap';

// Props for the visual block that appears on the canvas
export interface BlockComponentProps {
  block: RoadmapBlock;
  scale: number;
  offset: { x: number; y: number };
  canvasOffsetRef: React.MutableRefObject<{ x: number; y: number }>;
  isSelected: boolean;
  onSelect: (blockId: string, event: React.MouseEvent) => void;
  onMouseDown: (block: RoadmapBlock, event: React.MouseEvent, resizeHandle?: string) => void;
  onDelete: () => void;
  onConnectionPointClick: (
    blockId: string,
    side: 'top' | 'right' | 'bottom' | 'left',
    event: React.MouseEvent
  ) => void;
  onConnectionArrowMouseDown: (
    blockId: string,
    direction: 'up' | 'right' | 'bottom' | 'left',
    event: React.MouseEvent
  ) => void;
  readOnly: boolean;
  isDragging: boolean;
  isResizing: boolean;
  connectionMode: boolean;
  connectionStart: string | null;
}

/*
 * Stand-alone presentation component for a single roadmap block. All behaviour
 * (drag, resize, connections, etc.) is delegated to callbacks supplied by the
 * parent RoadmapBuilder, keeping this component purely presentational.
 */
const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  scale,
  offset,
  canvasOffsetRef,
  isSelected,
  onSelect,
  onMouseDown,
  onDelete,
  onConnectionPointClick,
  onConnectionArrowMouseDown,
  readOnly,
  isDragging,
  isResizing,
  connectionMode,
  connectionStart
}) => {
  // Used to toggle connection arrows on hover
  const [isHovered, setIsHovered] = useState(false);
  // Prefer the ref during panning for zero-lag movement
  const currentOffset = canvasOffsetRef?.current || offset;

  // Handle click events - only allow if not dragging/resizing
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't handle clicks if we're currently dragging or resizing
    if (isDragging || isResizing) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onSelect(block.block_id, e);
  }, [isDragging, isResizing, onSelect, block.block_id]);

  /* ---------- Inline styles ---------- */
  const blockStyle: React.CSSProperties = {
    position: 'absolute',
    left: (block.x + currentOffset.x) * scale,
    top: (block.y + currentOffset.y) * scale,
    width: block.width * scale,
    height: block.height * scale,
    backgroundColor: block.color,
    borderRadius: '8px',
    border: `${block.borderWidth ?? (isSelected ? 2 : 1)}px ${block.borderStyle ?? 'solid'} ${block.borderColor ?? (isSelected ? '#3B82F6' : 'rgba(0,0,0,0.1)')}`,
    cursor: readOnly ? 'pointer' : 'move',
    zIndex: isSelected ? 20 : 10,
    boxShadow: isSelected
      ? '0 8px 32px rgba(59, 130, 246, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    transform: isDragging || isResizing ? 'scale(1.02)' : 'scale(1)',
    transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
    willChange: 'transform'
  };

  return (
    <>
      {/* Main block */}
      <div
        style={blockStyle}
        onClick={handleClick}
        onMouseDown={(e) => onMouseDown(block, e)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center justify-center relative group"
      >
        {/* Outer label */}
        {block.outer_label && (
          <div
            className="absolute text-gray-700 text-sm font-medium text-center whitespace-nowrap"
            style={{
              fontSize: Math.max(10, 12 * scale),
              ...(block.outer_label_direction === 'up' && {
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '4px'
              }),
              ...(block.outer_label_direction === 'bottom' && {
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '4px'
              }),
              ...(block.outer_label_direction === 'left' && {
                right: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                marginRight: '8px'
              }),
              ...(block.outer_label_direction === 'right' && {
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                marginLeft: '8px'
              })
            }}
          >
            {block.outer_label}
          </div>
        )}

        {/* Delete button */}
        {!readOnly && isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors flex items-center justify-center"
            style={{ top: '-12px', right: '-12px', zIndex: 100 }}
          >
            ×
          </button>
        )}

        {/* Resize handles */}
        {!readOnly && isSelected && (
          <>
            {/* Top-left */}
            <div
              className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-sm hover:bg-blue-600 transition-colors"
              style={{ top: '-6px', left: '-6px', cursor: 'nw-resize', zIndex: 50 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(block, e, 'nw');
              }}
            />
            {/* Top-right */}
            <div
              className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-sm hover:bg-blue-600 transition-colors"
              style={{ top: '-6px', right: '8px', cursor: 'ne-resize', zIndex: 50 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(block, e, 'ne');
              }}
            />
            {/* Bottom-left */}
            <div
              className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-sm hover:bg-blue-600 transition-colors"
              style={{ bottom: '-6px', left: '-6px', cursor: 'sw-resize', zIndex: 50 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(block, e, 'sw');
              }}
            />
            {/* Bottom-right */}
            <div
              className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-sm hover:bg-blue-600 transition-colors"
              style={{ bottom: '-6px', right: '-6px', cursor: 'se-resize', zIndex: 50 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(block, e, 'se');
              }}
            />
          </>
        )}

        {/* Connection points */}
        {!readOnly && connectionMode && (
          <>
            {/* Top */}
            <div
              className={`absolute w-6 h-6 rounded-full border-2 border-white transition-colors cursor-pointer ${
                connectionStart === block.block_id ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
              }`}
              style={{ top: '-12px', left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}
              onClick={(e) => onConnectionPointClick(block.block_id, 'top', e)}
            />
            {/* Right */}
            <div
              className={`absolute w-6 h-6 rounded-full border-2 border-white transition-colors cursor-pointer ${
                connectionStart === block.block_id ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
              }`}
              style={{ top: '50%', right: '-12px', transform: 'translateY(-50%)', zIndex: 60 }}
              onClick={(e) => onConnectionPointClick(block.block_id, 'right', e)}
            />
            {/* Bottom */}
            <div
              className={`absolute w-6 h-6 rounded-full border-2 border-white transition-colors cursor-pointer ${
                connectionStart === block.block_id ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
              }`}
              style={{ bottom: '-12px', left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}
              onClick={(e) => onConnectionPointClick(block.block_id, 'bottom', e)}
            />
            {/* Left */}
            <div
              className={`absolute w-6 h-6 rounded-full border-2 border-white transition-colors cursor-pointer ${
                connectionStart === block.block_id ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
              }`}
              style={{ top: '50%', left: '-12px', transform: 'translateY(-50%)', zIndex: 60 }}
              onClick={(e) => onConnectionPointClick(block.block_id, 'left', e)}
            />
          </>
        )}

        {/* Connection arrows */}
        {!readOnly && isHovered && (
          <>
            {/* Up */}
            <div
              className="absolute w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
              style={{ top: '-16px', left: '50%', transform: 'translateX(-50%)', zIndex: 70 }}
              onMouseDown={(e) => onConnectionArrowMouseDown(block.block_id, 'up', e)}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l-8 8h16l-8-8z" />
              </svg>
            </div>
            {/* Right */}
            <div
              className="absolute w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
              style={{ top: '50%', right: '-16px', transform: 'translateY(-50%)', zIndex: 70 }}
              onMouseDown={(e) => onConnectionArrowMouseDown(block.block_id, 'right', e)}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12l-8 8v-16l8 8z" />
              </svg>
            </div>
            {/* Down */}
            <div
              className="absolute w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
              style={{ bottom: '-16px', left: '50%', transform: 'translateX(-50%)', zIndex: 70 }}
              onMouseDown={(e) => onConnectionArrowMouseDown(block.block_id, 'bottom', e)}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22l8-8h-16l8 8z" />
              </svg>
            </div>
            {/* Left */}
            <div
              className="absolute w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
              style={{ top: '50%', left: '-16px', transform: 'translateY(-50%)', zIndex: 70 }}
              onMouseDown={(e) => onConnectionArrowMouseDown(block.block_id, 'left', e)}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 12l8-8v16l-8-8z" />
              </svg>
            </div>
          </>
        )}

        {/* Inner label */}
        <span
          className="font-medium text-center px-4 select-none"
          style={{ fontSize: block.fontSize ? `${block.fontSize}px` : Math.max(12, 14 * scale), lineHeight: '1.2', color: block.titleColor || '#ffffff' }}
        >
          {block.inner_label}
        </span>
      </div>
    </>
  );
};

export default BlockComponent; 