import { useState, useEffect, useRef } from 'react';
import type { RoadmapData, RoadmapBlock } from '../types/roadmap';

interface RoadmapViewerProps {
  roadmapJson: string;
  onEdit?: () => void;
  showEditButton?: boolean;
}

const RoadmapViewer: React.FC<RoadmapViewerProps> = ({ 
  roadmapJson, 
  onEdit, 
  showEditButton = false 
}) => {
  const [roadmapData, setRoadmapData] = useState<RoadmapData>({ blocks: [] });
  const [selectedBlock, setSelectedBlock] = useState<RoadmapBlock | null>(null);
  const [showBlockDetail, setShowBlockDetail] = useState(false);
  
  // Pan and zoom state
  const [scale, setScale] = useState(0.8);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert old format to new format for compatibility
  const convertOldToNewFormat = (oldData: any): RoadmapData => {
    if (!oldData.blocks) return { blocks: [] };
    
    return {
      blocks: oldData.blocks.map((block: any) => {
        // If it's already in new format, use as is
        if (block.x !== undefined && block.y !== undefined) {
          return {
            ...block,
            connection_styles: block.connection_styles || {}, // Ensure connection_styles exists
            titleColor: block.titleColor, // Preserve title color
            borderColor: block.borderColor, // Preserve border color
            borderWidth: block.borderWidth, // Preserve border width
            borderStyle: block.borderStyle, // Preserve border style
            fontSize: block.fontSize // Preserve font size
          };
        }
        
        // Convert from old format
        return {
          block_id: block.block_id,
          x: block.left_coordinate || 0,
          y: block.up_coordinate || 0,
          width: (block.right_coordinate - block.left_coordinate) || 200,
          height: (block.down_coordinate - block.up_coordinate) || 100,
          color: block.color,
          inner_label: block.inner_label,
          outer_label: block.outer_label,
          outer_label_direction: block.outer_label_direction,
          html_content: block.html_content,
          connected_blocks: block.connected_blocks,
          connection_styles: block.connection_styles || {}, // Preserve connection styles
          titleColor: block.titleColor, // Preserve title color
          borderColor: block.borderColor, // Preserve border color
          borderWidth: block.borderWidth, // Preserve border width
          borderStyle: block.borderStyle, // Preserve border style
          fontSize: block.fontSize // Preserve font size
        };
      })
    };
  };

  useEffect(() => {
    try {
      const parsed = JSON.parse(roadmapJson);
      const converted = convertOldToNewFormat(parsed);
      setRoadmapData(converted);
    } catch (error) {
      console.error('Failed to parse roadmap data:', error);
      setRoadmapData({ blocks: [] });
    }
  }, [roadmapJson]);

  // Touch and mouse event handlers
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setLastTouch({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - lastTouch.x;
    const deltaY = clientY - lastTouch.y;
    
    setPanX(prev => prev + deltaX);
    setPanY(prev => prev + deltaY);
    setLastTouch({ x: clientX, y: clientY });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Zoom functions
  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3));
  const resetView = () => {
    setScale(0.8);
    setPanX(0);
    setPanY(0);
  };

  const handleBlockClick = (block: RoadmapBlock, e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) return; // Don't open modal if we were dragging
    e.stopPropagation();
    setSelectedBlock(block);
    setShowBlockDetail(true);
  };

  const closeBlockDetail = () => {
    setShowBlockDetail(false);
    setSelectedBlock(null);
  };

  // Process HTML content to ensure black text
  const processHtmlContent = (html: string): string => {
    if (!html) return '<p style="color: #000000;">No content available</p>';
    
    // Create a temporary div to parse and modify the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Function to recursively set text color to black and fix list styling
    const setTextColorBlack = (element: Element) => {
      if (element.nodeType === 1) { // Element node
        const htmlElement = element as HTMLElement;
        
        // Set color to black if not already set or if it's white/transparent
        const currentColor = htmlElement.style.color;
        if (!currentColor || currentColor === 'white' || currentColor === '#ffffff' || currentColor === '#fff' || currentColor === 'transparent') {
          htmlElement.style.color = '#000000';
        }
        
        // Fix list styling
        if (htmlElement.tagName.toLowerCase() === 'ul') {
          htmlElement.style.listStyleType = 'disc';
          htmlElement.style.paddingLeft = '1.5rem';
        } else if (htmlElement.tagName.toLowerCase() === 'ol') {
          htmlElement.style.listStyleType = 'decimal';
          htmlElement.style.paddingLeft = '1.5rem';
        } else if (htmlElement.tagName.toLowerCase() === 'li') {
          htmlElement.style.display = 'list-item';
          htmlElement.style.marginLeft = '0';
        }
        
        // Process child elements
        Array.from(element.children).forEach(setTextColorBlack);
      }
    };
    
    // Process all elements
    Array.from(tempDiv.children).forEach(setTextColorBlack);
    
    return tempDiv.innerHTML;
  };

  if (roadmapData.blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">No roadmap content available</p>
          {showEditButton && onEdit && (
            <button
              onClick={onEdit}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create Visual Roadmap
            </button>
          )}
        </div>
      </div>
    );
  }

  // Calculate bounds for centering
  const bounds = roadmapData.blocks.reduce((acc, block) => ({
    minX: Math.min(acc.minX, block.x),
    maxX: Math.max(acc.maxX, block.x + block.width),
    minY: Math.min(acc.minY, block.y),
    maxY: Math.max(acc.maxY, block.y + block.height)
  }), {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity
  });

  const canvasWidth = bounds.maxX - bounds.minX + 400; // Add padding
  const canvasHeight = bounds.maxY - bounds.minY + 400;
  const offsetX = -bounds.minX + 200; // Center with padding
  const offsetY = -bounds.minY + 200;

  // Generate curved path for connections
  const generateCurvedPath = (startX: number, startY: number, endX: number, endY: number) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const controlOffset = Math.min(distance * 0.5, 100);

    const cp1x = startX + controlOffset;
    const cp1y = startY;
    const cp2x = endX - controlOffset;
    const cp2y = endY;

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  };

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border">
      {/* Header with zoom controls */}
      <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b z-30 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Roadmap Visualization</h3>
          <div className="flex items-center space-x-2">
            {/* Zoom controls */}
            <div className="flex items-center space-x-1 bg-gray-200 rounded-lg p-1">
              <button
                onClick={zoomOut}
                className="p-1 hover:bg-gray-300 rounded text-gray-600"
                title="Zoom Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={resetView}
                className="px-2 py-1 hover:bg-gray-300 rounded text-xs text-gray-600"
                title="Reset View"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="p-1 hover:bg-gray-300 rounded text-gray-600"
                title="Zoom In"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {showEditButton && onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Edit Roadmap</span>
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Drag to pan • Pinch or use controls to zoom
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="absolute inset-0 pt-20 cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="relative transition-transform duration-100"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            transformOrigin: 'top left'
          }}
        >
          {/* Render connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={canvasWidth}
            height={canvasHeight}
          >
            {roadmapData.blocks.map(block =>
              Object.entries(block.connected_blocks).map(([targetId]) => {
                const targetBlock = roadmapData.blocks.find(b => b.block_id === targetId);
                if (!targetBlock) return null;

                const startX = block.x + block.width / 2 + offsetX;
                const startY = block.y + block.height / 2 + offsetY;
                const endX = targetBlock.x + targetBlock.width / 2 + offsetX;
                const endY = targetBlock.y + targetBlock.height / 2 + offsetY;

                return (
                  <path
                    key={`${block.block_id}-${targetId}`}
                    d={generateCurvedPath(startX, startY, endX, endY)}
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="none"
                    markerEnd="url(#arrowhead-viewer)"
                  />
                );
              })
            ).flat()}
            
            {/* Arrow marker */}
            <defs>
              <marker
                id="arrowhead-viewer"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#3B82F6"
                />
              </marker>
            </defs>
          </svg>

          {/* Render blocks */}
          {roadmapData.blocks.map(block => (
            <div key={block.block_id}>
              {/* Outer label */}
              {block.outer_label && (
                <div
                  className="absolute text-gray-700 text-sm font-medium pointer-events-none"
                  style={{
                    fontSize: Math.max(10, 12 * scale),
                    ...(block.outer_label_direction === 'up' && {
                      left: block.x + offsetX,
                      top: block.y + offsetY - 25,
                      width: block.width,
                      textAlign: 'center'
                    }),
                    ...(block.outer_label_direction === 'bottom' && {
                      left: block.x + offsetX,
                      top: block.y + block.height + offsetY + 5,
                      width: block.width,
                      textAlign: 'center'
                    }),
                    ...(block.outer_label_direction === 'left' && {
                      right: canvasWidth - (block.x + offsetX) + 8,
                      top: block.y + offsetY + block.height / 2,
                      transform: 'translateY(-50%)',
                      textAlign: 'right',
                      whiteSpace: 'nowrap'
                    }),
                    ...(block.outer_label_direction === 'right' && {
                      left: block.x + block.width + offsetX + 8,
                      top: block.y + offsetY + block.height / 2,
                      transform: 'translateY(-50%)',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    })
                  }}
                >
                  {block.outer_label}
                </div>
              )}
              
              {/* Block */}
              <div
                className="absolute cursor-pointer hover:scale-105 transition-transform pointer-events-auto"
                style={{
                  left: block.x + offsetX,
                  top: block.y + offsetY,
                  width: block.width,
                  height: block.height,
                  backgroundColor: block.color,
                  borderRadius: '8px',
                  border: `${block.borderWidth ?? 2}px ${block.borderStyle ?? 'solid'} ${block.borderColor ?? 'rgba(0,0,0,0.1)'}`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 10
                }}
                onMouseDown={(e) => handleBlockClick(block, e)}
                onTouchStart={(e) => handleBlockClick(block, e)}
              >
                <div className="flex items-center justify-center h-full p-4">
                  <span 
                    className="font-medium text-center"
                    style={{ 
                      fontSize: block.fontSize ? `${block.fontSize * scale}px` : `${14 * scale}px`,
                      color: block.titleColor || '#ffffff',
                      lineHeight: '1.2'
                    }}
                  >
                    {block.inner_label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Block Detail Modal */}
      {showBlockDetail && selectedBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedBlock.inner_label}</h3>
              <button
                onClick={closeBlockDetail}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {selectedBlock.outer_label && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Category</h4>
                <p className="text-gray-800">{selectedBlock.outer_label}</p>
              </div>
            )}

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Content</h4>
              <div 
                className="prose prose-sm max-w-none bg-white text-gray-900 p-4 rounded border prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4"
                style={{
                  '--tw-prose-bullets': '#000000',
                  '--tw-prose-counters': '#000000'
                } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: processHtmlContent(selectedBlock.html_content) }}
              />
            </div>

            {Object.keys(selectedBlock.connected_blocks).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Connected To</h4>
                <div className="space-y-1">
                  {Object.entries(selectedBlock.connected_blocks).map(([targetId, direction]) => {
                    const targetBlock = roadmapData.blocks.find(b => b.block_id === targetId);
                    return targetBlock ? (
                      <div key={targetId} className="flex items-center space-x-2 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{direction}</span>
                        <span>{targetBlock.inner_label}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={closeBlockDetail}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapViewer; 