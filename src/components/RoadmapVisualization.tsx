import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { RoadmapBlock, RoadmapData } from '../types/roadmap';
import type { ConnectionStyle } from '../types/roadmap';

interface RoadmapVisualizationProps {
  data: string; // JSON string of roadmap data
  className?: string;
}

const RoadmapVisualization: React.FC<RoadmapVisualizationProps> = ({ 
  data, 
  className = "" 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasOffsetRef = useRef({ x: 0, y: 0 });
  const [roadmapData, setRoadmapData] = useState<RoadmapData>({ blocks: [] });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showBlockContent, setShowBlockContent] = useState(false);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragType: 'canvas' | null;
    startPos: { x: number; y: number };
    currentPos: { x: number; y: number };
    lastPos?: { x: number; y: number };
  }>({
    isDragging: false,
    dragType: null,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 }
  });

  // Grid size
  const GRID_SIZE = 20;

  // Update canvas offset ref when state changes
  useEffect(() => {
    canvasOffsetRef.current = canvasOffset;
  }, [canvasOffset]);

  // Convert old format to new format
  const convertOldToNewFormat = (oldData: any): RoadmapData => {
    if (!oldData.blocks) return { blocks: [] };
    
    return {
      blocks: oldData.blocks.map((block: any) => ({
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
        connection_styles: block.connection_styles || {}
      }))
    };
  };

  // Initialize from props
  useEffect(() => {
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const converted = convertOldToNewFormat(parsed);
        setRoadmapData(converted);
      } catch (error) {
        console.error('Failed to parse roadmap data:', error);
      }
    }
  }, [data]);

  // Get default connection style
  const getDefaultConnectionStyle = (): ConnectionStyle => ({
    color: '#3B82F6',
    weight: 4,
    style: 'solid',
    curve: 'orthogonal',
    dashGap: 1
  });

  // Get connection style for a specific connection
  const getConnectionStyle = (fromBlockId: string, toBlockId: string): ConnectionStyle => {
    const block = roadmapData.blocks.find(b => b.block_id === fromBlockId);
    return block?.connection_styles?.[toBlockId] || getDefaultConnectionStyle();
  };

  // Handle block click to show content
  const handleBlockClick = useCallback((blockId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedBlock(blockId);
    setShowBlockContent(true);
  }, []);

  // Handle mouse move for canvas panning
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (dragState.dragType !== 'canvas') return;

    const currentX = event.clientX;
    const currentY = event.clientY;
    const lastX = dragState.lastPos?.x ?? dragState.startPos.x;
    const lastY = dragState.lastPos?.y ?? dragState.startPos.y;
    
    const deltaX = currentX - lastX;
    const deltaY = currentY - lastY;

    // Immediate canvas panning
    const newOffset = {
      x: canvasOffsetRef.current.x + deltaX,
      y: canvasOffsetRef.current.y + deltaY
    };
    canvasOffsetRef.current = newOffset;
    
    // Force immediate re-render
    requestAnimationFrame(() => {
      setCanvasOffset(newOffset);
    });
    
    // Update position
    setDragState(prev => ({
      ...prev,
      currentPos: { x: currentX, y: currentY },
      lastPos: { x: currentX, y: currentY }
    }));
  }, [dragState]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 }
    });
  }, []);

  // Add mouse event listeners
  useEffect(() => {
    if (dragState.dragType) {
      const options = { passive: false };
      document.addEventListener('mousemove', handleMouseMove, options);
      document.addEventListener('mouseup', handleMouseUp, options);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.dragType, handleMouseMove, handleMouseUp]);

  // Canvas mouse down for panning
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    const isCanvasClick = event.target === event.currentTarget || (event.target as Element)?.classList?.contains('canvas-background');
    if (isCanvasClick) {
      setDragState({
        isDragging: false,
        dragType: 'canvas',
        startPos: { x: event.clientX, y: event.clientY },
        currentPos: { x: event.clientX, y: event.clientY },
        lastPos: { x: event.clientX, y: event.clientY }
      });
    }
  }, []);

  // Container click to deselect
  const handleContainerClick = useCallback(() => {
    setSelectedBlock(null);
    setShowBlockContent(false);
  }, []);

  // Path generators (simplified versions)
  const generateCurvedPath = (startX: number, startY: number, endX: number, endY: number, direction: 'up' | 'bottom' | 'right' | 'left', targetDirection: 'up' | 'bottom' | 'right' | 'left') => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const baseOffset = Math.min(distance * 0.4, 150);
    let cp1x, cp1y, cp2x, cp2y;
    switch (direction) {
      case 'up': cp1x = startX; cp1y = startY - baseOffset; break;
      case 'bottom': cp1x = startX; cp1y = startY + baseOffset; break;
      case 'left': cp1x = startX - baseOffset; cp1y = startY; break;
      case 'right': cp1x = startX + baseOffset; cp1y = startY; break;
      default: cp1x = startX + baseOffset; cp1y = startY;
    }
    switch (targetDirection) {
      case 'up': cp2x = endX; cp2y = endY - baseOffset; break;
      case 'bottom': cp2x = endX; cp2y = endY + baseOffset; break;
      case 'left': cp2x = endX - baseOffset; cp2y = endY; break;
      case 'right': cp2x = endX + baseOffset; cp2y = endY; break;
      default: cp2x = endX + baseOffset; cp2y = endY;
    }
    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  };

  const generateOrthogonalPath = (startX: number, startY: number, endX: number, endY: number, direction: 'up' | 'bottom' | 'right' | 'left', targetDirection: 'up' | 'bottom' | 'right' | 'left') => {
    const offset = 20;
    let p1 = { x: startX, y: startY };
    switch (direction) {
      case 'up': p1.y -= offset; break;
      case 'bottom': p1.y += offset; break;
      case 'left': p1.x -= offset; break;
      case 'right': p1.x += offset; break;
    }
    let pLastMinus1 = { x: endX, y: endY };
    switch (targetDirection) {
      case 'up': pLastMinus1.y -= offset; break;
      case 'bottom': pLastMinus1.y += offset; break;
      case 'left': pLastMinus1.x -= offset; break;
      case 'right': pLastMinus1.x += offset; break;
    }

    const horizontalFirst = direction === 'left' || direction === 'right';
    const candidateA: { x: number; y: number }[] = horizontalFirst
      ? [ { x: startX, y: startY }, p1, { x: pLastMinus1.x, y: p1.y }, pLastMinus1, { x: endX, y: endY } ]
      : [ { x: startX, y: startY }, p1, { x: p1.x, y: pLastMinus1.y }, pLastMinus1, { x: endX, y: endY } ];

    // Build rounded path
    const radius = 8;
    let d = `M ${candidateA[0].x} ${candidateA[0].y}`;
    for (let i = 1; i < candidateA.length; i++) {
      const prev = candidateA[i - 1];
      const curr = candidateA[i];
      const next = candidateA[i + 1];
      if (!next) {
        d += ` L ${curr.x} ${curr.y}`;
      } else {
        const dirPrevX = Math.sign(curr.x - prev.x);
        const dirPrevY = Math.sign(curr.y - prev.y);
        const dirNextX = Math.sign(next.x - curr.x);
        const dirNextY = Math.sign(next.y - curr.y);
        const startCorner = {
          x: curr.x - dirPrevX * radius,
          y: curr.y - dirPrevY * radius
        };
        const endCorner = {
          x: curr.x + dirNextX * radius,
          y: curr.y + dirNextY * radius
        };
        d += ` L ${startCorner.x} ${startCorner.y} Q ${curr.x} ${curr.y} ${endCorner.x} ${endCorner.y}`;
      }
    }
    return d;
  };

  const generateConnectionPath = (startX: number, startY: number, endX: number, endY: number, direction: 'up' | 'bottom' | 'right' | 'left', targetDirection: 'up' | 'bottom' | 'right' | 'left', curve: 'curved' | 'straight' | 'orthogonal') => {
    if (curve === 'straight') {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    } else if (curve === 'orthogonal') {
      return generateOrthogonalPath(startX, startY, endX, endY, direction, targetDirection);
    } else {
      return generateCurvedPath(startX, startY, endX, endY, direction, targetDirection);
    }
  };

  // Get selected block data
  const selectedBlockData = selectedBlock ? roadmapData.blocks.find(b => b.block_id === selectedBlock) : null;

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

  return (
    <div className={`relative w-full h-full bg-gray-50 overflow-hidden flex ${className}`} onClick={handleContainerClick}>
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-50 bg-white rounded-lg shadow-lg border p-3">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setScale(prev => Math.max(0.25, prev - 0.25))}
            className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <div className="text-xs text-center py-1 text-gray-500">
            {Math.round(scale * 100)}%
          </div>
          
          <button
            onClick={() => setScale(prev => Math.min(2, prev + 0.25))}
            className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg border px-4 py-2">
        <p className="text-sm text-gray-600">
          <span className="text-blue-600 font-medium">Roadmap Visualization</span> • Click blocks to view content • Drag to pan
        </p>
      </div>

      {/* Main Canvas */}
      <div
        className="flex-1 relative"
        style={{ 
          cursor: dragState.dragType === 'canvas' ? 'grabbing' : 'grab'
        }}
      >
        <div
          ref={canvasRef}
          className="absolute inset-0 canvas-background"
          style={{
            backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
            backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
            backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
            willChange: 'transform'
          }}
          onMouseDown={handleCanvasMouseDown}
        >
          {/* Render connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 5 }}
            width="100%"
            height="100%"
          >
            {roadmapData.blocks.map(block =>
              Object.entries(block.connected_blocks).map(([connectionKey, direction]) => {
                // Parse composite key: targetBlockId:sourceDirection->targetDirection
                let targetId: string;
                let parsedDirection: string;
                
                if (connectionKey.includes(':')) {
                  // New composite key format
                  const [actualTargetId, connectionValue] = connectionKey.split(':');
                  targetId = actualTargetId;
                  parsedDirection = connectionValue;
                } else {
                  // Legacy format - key is the target block ID
                  targetId = connectionKey;
                  parsedDirection = direction as string;
                }
                
                const targetBlock = roadmapData.blocks.find(b => b.block_id === targetId);
                if (!targetBlock) return null;

                const connectionStyle = getConnectionStyle(block.block_id, targetId);

                // Parse connection format: "sourceEdge->targetEdge" or legacy single edge
                let sourceEdge: 'up' | 'bottom' | 'right' | 'left';
                let targetEdge: 'up' | 'bottom' | 'right' | 'left';
                
                if (typeof parsedDirection === 'string' && parsedDirection.includes('->')) {
                  const [source, target] = parsedDirection.split('->');
                  sourceEdge = source as 'up' | 'bottom' | 'right' | 'left';
                  targetEdge = target as 'up' | 'bottom' | 'right' | 'left';
                } else {
                  // Legacy format
                  sourceEdge = parsedDirection as 'up' | 'bottom' | 'right' | 'left';
                  const sourceX = block.x + block.width / 2;
                  const sourceY = block.y + block.height / 2;
                  const targetX = targetBlock.x + targetBlock.width / 2;
                  const targetY = targetBlock.y + targetBlock.height / 2;
                  const deltaX = targetX - sourceX;
                  const deltaY = targetY - sourceY;
                  const absX = Math.abs(deltaX);
                  const absY = Math.abs(deltaY);
                  
                  if (absX > absY) {
                    targetEdge = deltaX > 0 ? 'left' : 'right';
                  } else {
                    targetEdge = deltaY > 0 ? 'up' : 'bottom';
                  }
                }

                // Calculate connection points
                let startX, startY, endX, endY;

                // Start point
                switch (sourceEdge) {
                  case 'up':
                    startX = (block.x + block.width / 2 + canvasOffsetRef.current.x) * scale;
                    startY = (block.y + canvasOffsetRef.current.y) * scale;
                    break;
                  case 'bottom':
                    startX = (block.x + block.width / 2 + canvasOffsetRef.current.x) * scale;
                    startY = (block.y + block.height + canvasOffsetRef.current.y) * scale;
                    break;
                  case 'left':
                    startX = (block.x + canvasOffsetRef.current.x) * scale;
                    startY = (block.y + block.height / 2 + canvasOffsetRef.current.y) * scale;
                    break;
                  case 'right':
                    startX = (block.x + block.width + canvasOffsetRef.current.x) * scale;
                    startY = (block.y + block.height / 2 + canvasOffsetRef.current.y) * scale;
                    break;
                  default:
                    startX = (block.x + block.width / 2 + canvasOffsetRef.current.x) * scale;
                    startY = (block.y + block.height / 2 + canvasOffsetRef.current.y) * scale;
                }

                // End point
                let targetDirection: 'up' | 'bottom' | 'right' | 'left';
                
                switch (targetEdge) {
                  case 'up':
                    endX = (targetBlock.x + targetBlock.width / 2 + canvasOffsetRef.current.x) * scale;
                    endY = (targetBlock.y + canvasOffsetRef.current.y) * scale;
                    targetDirection = 'up';
                    break;
                  case 'bottom':
                    endX = (targetBlock.x + targetBlock.width / 2 + canvasOffsetRef.current.x) * scale;
                    endY = (targetBlock.y + targetBlock.height + canvasOffsetRef.current.y) * scale;
                    targetDirection = 'bottom';
                    break;
                  case 'left':
                    endX = (targetBlock.x + canvasOffsetRef.current.x) * scale;
                    endY = (targetBlock.y + targetBlock.height / 2 + canvasOffsetRef.current.y) * scale;
                    targetDirection = 'left';
                    break;
                  case 'right':
                    endX = (targetBlock.x + targetBlock.width + canvasOffsetRef.current.x) * scale;
                    endY = (targetBlock.y + targetBlock.height / 2 + canvasOffsetRef.current.y) * scale;
                    targetDirection = 'right';
                    break;
                  default:
                    endX = (targetBlock.x + targetBlock.width / 2 + canvasOffsetRef.current.x) * scale;
                    endY = (targetBlock.y + targetBlock.height / 2 + canvasOffsetRef.current.y) * scale;
                    targetDirection = 'right';
                }

                // Generate path
                const pathData = generateConnectionPath(
                  startX, 
                  startY, 
                  endX, 
                  endY, 
                  sourceEdge, 
                  targetDirection, 
                  connectionStyle.curve
                );

                // Calculate stroke dash array
                const getStrokeDashArray = (style: 'solid' | 'dashed' | 'dotted', weight: number, gap: number = 1) => {
                  switch (style) {
                    case 'dashed':
                      return `${weight * 2},${weight * gap}`;
                    case 'dotted':
                      return `${weight * 0.5},${weight * 0.75 * gap}`;
                    case 'solid':
                    default:
                      return 'none';
                  }
                };

                return (
                  <path
                    key={`${block.block_id}-${targetId}-${parsedDirection}`}
                    d={pathData}
                    stroke={connectionStyle.color}
                    strokeWidth={connectionStyle.weight}
                    strokeDasharray={getStrokeDashArray(connectionStyle.style, connectionStyle.weight, connectionStyle.dashGap)}
                    fill="none"
                    opacity={0.9}
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                  />
                );
              })
            ).flat()}
          </svg>

          {/* Render blocks */}
          {roadmapData.blocks.map(block => (
            <div
              key={block.block_id}
              className="absolute cursor-pointer hover:shadow-lg transition-shadow duration-200"
              style={{
                left: (block.x + canvasOffset.x) * scale,
                top: (block.y + canvasOffset.y) * scale,
                width: block.width * scale,
                height: block.height * scale,
                backgroundColor: block.color,
                borderRadius: '8px',
                border: selectedBlock === block.block_id ? '3px solid #3B82F6' : '2px solid rgba(0,0,0,0.1)',
                zIndex: 10
              }}
              onClick={(e) => handleBlockClick(block.block_id, e)}
            >
              {/* Inner Label */}
              <div
                className="absolute inset-2 flex items-center justify-center text-white font-semibold text-center overflow-hidden"
                style={{
                  fontSize: Math.max(12, 14 * scale),
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {block.inner_label}
              </div>

              {/* Outer Label */}
              {block.outer_label && (
                <div
                  className="absolute text-gray-700 font-medium text-center whitespace-nowrap"
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
                    })
                  }}
                >
                  {block.outer_label}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Block Content Panel */}
      {showBlockContent && selectedBlockData && (
        <div 
          className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl border-l z-50 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">{selectedBlockData.inner_label}</h3>
              <button
                onClick={() => {
                  setShowBlockContent(false);
                  setSelectedBlock(null);
                }}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <div 
              className="h-full prose prose-sm max-w-none p-4 prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4"
              style={{ 
                color: '#000000',
                '--tw-prose-body': '#000000',
                '--tw-prose-headings': '#000000',
                '--tw-prose-links': '#000000',
                '--tw-prose-bold': '#000000',
                '--tw-prose-counters': '#000000',
                '--tw-prose-bullets': '#000000',
                '--tw-prose-hr': '#000000',
                '--tw-prose-quotes': '#000000',
                '--tw-prose-quote-borders': '#000000',
                '--tw-prose-captions': '#000000',
                '--tw-prose-code': '#000000',
                '--tw-prose-pre-code': '#000000',
                '--tw-prose-pre-bg': '#f3f4f6',
                '--tw-prose-th-borders': '#000000',
                '--tw-prose-td-borders': '#000000'
              } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: processHtmlContent(selectedBlockData.html_content || '') }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapVisualization; 