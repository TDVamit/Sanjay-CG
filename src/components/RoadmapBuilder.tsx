import React, { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BlockComponent from './BlockComponent';
import RightPanel from './RightPanel';
import ConnectionPanel from './ConnectionPanel';
import { roadmapAPI } from '../services/api';
import type { RoadmapBlock, RoadmapData } from '../types/roadmap';
import type { ConnectionStyle } from '../types/roadmap';

interface RoadmapBuilderProps {
  initialData?: string;
  onSave: (roadmapJson: string) => void;
  readOnly?: boolean;
  roadmapId?: string;        // ID for PUT update
  authToken?: string;        // Bearer token for authorization
  name?: string;
  description?: string;
  categoryIds?: string[];
}

const RoadmapBuilder: React.FC<RoadmapBuilderProps> = ({ 
  initialData, 
  onSave, 
  readOnly = false,
  roadmapId,
  name = '',
  description = '',
  categoryIds = []
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasOffsetRef = useRef({ x: 0, y: 0 });
  const [roadmapData, setRoadmapData] = useState<RoadmapData>({ blocks: [] });
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [scale, setScale] = useState(1);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [connectionDragState, setConnectionDragState] = useState<{
    isConnecting: boolean;
    sourceBlockId: string | null;
    sourceDirection: 'up' | 'right' | 'bottom' | 'left' | null;
    currentPos: { x: number; y: number };
    targetBlockId: string | null;
    targetDirection: 'up' | 'bottom' | 'right' | 'left' | null;
  }>({
    isConnecting: false,
    sourceBlockId: null,
    sourceDirection: null,
    currentPos: { x: 0, y: 0 },
    targetBlockId: null,
    targetDirection: null
  });
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    isResizing: boolean;
    isCreating: boolean;
    dragType: 'move' | 'resize' | 'canvas' | 'create' | null;
    startPos: { x: number; y: number };
    currentPos: { x: number; y: number };
    resizeHandle?: string;
    createStart?: { x: number; y: number };
    initialBlockState?: RoadmapBlock;
    lastPos?: { x: number; y: number };
  }>({
    isDragging: false,
    isResizing: false,
    isCreating: false,
    dragType: null,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 }
  });

  // --- Undo/Redo State ---
  const [, setHistory] = useState<RoadmapData[]>([]);
  const [, setFuture] = useState<RoadmapData[]>([]);

  const pushHistory = useCallback((snapshot: RoadmapData) => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(snapshot))]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      setFuture(f => [prev[prev.length - 1], ...f]);
      setRoadmapData(prev[prev.length - 2]);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      setHistory(h => [...h, prev[0]]);
      setRoadmapData(prev[0]);
      return prev.slice(1);
    });
  }, []);

  // --- Copy/Paste State ---
  const [copiedBlocks, setCopiedBlocks] = useState<RoadmapBlock[]>([]);

  // Derived data for the currently selected block (null if none). Placed here so it exists before any callbacks use it.
  const selectedBlockData = React.useMemo(() => {
    return selectedBlock ? roadmapData.blocks.find(b => b.block_id === selectedBlock) ?? null : null;
  }, [selectedBlock, roadmapData.blocks]);

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
        connection_styles: block.connection_styles || {} // Preserve connection styles
      }))
    };
  };

  // Initialize from props
  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        const converted = convertOldToNewFormat(parsed);
        setRoadmapData(converted);
      } catch (error) {
        console.error('Failed to parse initial roadmap data:', error);
      }
    }
  }, [initialData]);

  // Grid size
  const GRID_SIZE = 20;

  // Snap to grid
  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

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

  // Update connection style
  const updateConnectionStyle = useCallback((fromBlockId: string, toBlockId: string, updates: Partial<ConnectionStyle>) => {
    setRoadmapData(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => {
        if (block.block_id === fromBlockId) {
          const currentStyle = block.connection_styles?.[toBlockId] || getDefaultConnectionStyle();
          return {
            ...block,
            connection_styles: {
              ...block.connection_styles,
              [toBlockId]: { ...currentStyle, ...updates }
            }
          };
        }
        return block;
      })
    }));
  }, []);

  // Create new block
  const createBlock = useCallback((x: number, y: number, width?: number, height?: number) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const canvasX = (x - canvasRect.left - canvasOffset.x) / scale;
    const canvasY = (y - canvasRect.top - canvasOffset.y) / scale;

    const newBlock: RoadmapBlock = {
      block_id: uuidv4(),
      x: snapToGrid(canvasX),
      y: snapToGrid(canvasY),
      width: width || 200,
      height: height || 100,
      color: '#3B82F6',
      inner_label: 'New Block',
      outer_label: '',
      outer_label_direction: 'up',
      html_content: '<p>Click to edit content</p>',
      connected_blocks: {}
    };

    setRoadmapData(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));

    return newBlock.block_id;
  }, [canvasOffset, scale]);

  // Update block
  const updateBlock = useCallback((blockId: string, updates: Partial<RoadmapBlock>) => {
    setRoadmapData(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.block_id === blockId ? { ...block, ...updates } : block
      )
    }));
  }, []);

  // Delete block
  const deleteBlock = useCallback((blockId: string) => {
    setRoadmapData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.block_id !== blockId)
        .map(block => ({
          ...block,
          connected_blocks: Object.fromEntries(
            Object.entries(block.connected_blocks).filter(([connectionKey]) => {
              // Handle both new composite key format and legacy format
              if (connectionKey.includes(':')) {
                // New format: targetBlockId:sourceDirection->targetDirection
                const [targetId] = connectionKey.split(':');
                return targetId !== blockId;
              } else {
                // Legacy format: key is the target block ID
                return connectionKey !== blockId;
              }
            })
          )
        }))
    }));
    setSelectedBlocks(prev => prev.filter(id => id !== blockId));
  }, []);

  const deleteSelectedBlocks = useCallback(() => {
    setRoadmapData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => !selectedBlocks.includes(block.block_id))
        .map(block => ({
          ...block,
          connected_blocks: Object.fromEntries(
            Object.entries(block.connected_blocks).filter(([connectionKey]) => {
              // Handle both new composite key format and legacy format
              if (connectionKey.includes(':')) {
                // New format: targetBlockId:sourceDirection->targetDirection
                const [targetId] = connectionKey.split(':');
                return !selectedBlocks.includes(targetId);
              } else {
                // Legacy format: key is the target block ID
                return !selectedBlocks.includes(connectionKey);
              }
            })
          )
        }))
    }));
    setSelectedBlocks([]);
  }, [selectedBlocks]);

  // Handle block selection
  const handleBlockSelect = useCallback((blockId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // Don't clear selectedConnections here to maintain red highlighting
    setShowConnectionPanel(false);
    // Only clear connection selection on single click (not Ctrl/Cmd or Shift)
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
      setSelectedConnections([]);
    }
    if (event.ctrlKey || event.metaKey) {
      setSelectedBlocks(prev => prev.includes(blockId) ? prev.filter(id => id !== blockId) : [...prev, blockId]);
    } else if (event.shiftKey && selectedBlocks.length > 0) {
      // Range select: select all between last and current
      const ids = roadmapData.blocks.map(b => b.block_id);
      const last = ids.indexOf(selectedBlocks[selectedBlocks.length - 1]);
      const curr = ids.indexOf(blockId);
      if (last !== -1 && curr !== -1) {
        const [start, end] = [last, curr].sort((a, b) => a - b);
        const range = ids.slice(start, end + 1);
        setSelectedBlocks(Array.from(new Set([...selectedBlocks, ...range])));
      }
    } else {
      setSelectedBlocks([blockId]);
    }
    setSelectedBlock(blockId);
  }, [roadmapData.blocks, selectedBlocks, selectedConnections]);

  // Handle block mouse down
  const handleBlockMouseDown = useCallback((block: RoadmapBlock, event: React.MouseEvent, resizeHandle?: string) => {
    if (readOnly) return;
    pushHistory(roadmapData);
    
    event.stopPropagation();
    // Don't clear selectedConnections here to maintain red highlighting
    setShowConnectionPanel(false);
    
    if (resizeHandle) {
      setDragState({
        isDragging: false,
        isResizing: true,
        isCreating: false,
        dragType: 'resize',
        startPos: { x: event.clientX, y: event.clientY },
        currentPos: { x: event.clientX, y: event.clientY },
        resizeHandle,
        initialBlockState: { ...block },
        lastPos: { x: event.clientX, y: event.clientY }
      });
    } else {
      // Only start drag after a small movement to prevent accidental drags on click
      setDragState({
        isDragging: false,
        isResizing: false,
        isCreating: false,
        dragType: 'move',
        startPos: { x: event.clientX, y: event.clientY },
        currentPos: { x: event.clientX, y: event.clientY },
        lastPos: { x: event.clientX, y: event.clientY }
      });
    }
    
    setSelectedBlock(block.block_id);
  }, [readOnly, roadmapData, pushHistory]);

  // Handle mouse move - optimized for maximum performance
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.dragType || readOnly) return;

    const currentX = event.clientX;
    const currentY = event.clientY;
    const lastX = dragState.lastPos?.x ?? dragState.startPos.x;
    const lastY = dragState.lastPos?.y ?? dragState.startPos.y;
    
    const deltaX = currentX - lastX;
    const deltaY = currentY - lastY;
    const totalDeltaX = currentX - dragState.startPos.x;
    const totalDeltaY = currentY - dragState.startPos.y;

    // Update current position for all operations
    setDragState(prev => ({
      ...prev,
      currentPos: { x: currentX, y: currentY }
    }));

    // Canvas panning: IMMEDIATE response with ZERO delay
    if (dragState.dragType === 'canvas') {
      // Immediate canvas panning - no checks, no delays, no thresholds
      const newOffset = {
        x: canvasOffsetRef.current.x + deltaX,
        y: canvasOffsetRef.current.y + deltaY
      };
      canvasOffsetRef.current = newOffset;
      
      // Force immediate re-render using requestAnimationFrame for smooth 60fps updates
      requestAnimationFrame(() => {
        setCanvasOffset(newOffset);
        setRenderTrigger(prev => prev + 1);
      });
      
      // Update position immediately
      setDragState(prev => ({
        ...prev,
        lastPos: { x: currentX, y: currentY }
      }));
      return;
    }

    // For non-canvas operations, check if we should start dragging
    const movementThreshold = 3;
    const hasMovedEnough = Math.abs(totalDeltaX) + Math.abs(totalDeltaY) >= movementThreshold;

    if (dragState.dragType === 'move' && selectedBlock) {
      const block = roadmapData.blocks.find(b => b.block_id === selectedBlock);
      if (block) {
        if (!dragState.isDragging && hasMovedEnough) {
          setDragState(prev => ({ ...prev, isDragging: true }));
        }
        
        if (dragState.isDragging || hasMovedEnough) {
          updateBlock(selectedBlock, {
            x: block.x + deltaX / scale,
            y: block.y + deltaY / scale
          });
        }
      }
    } else if (dragState.dragType === 'resize' && selectedBlock && dragState.initialBlockState) {
      if (!dragState.isResizing && hasMovedEnough) {
        setDragState(prev => ({ ...prev, isResizing: true }));
      }
      
      if (dragState.isResizing || hasMovedEnough) {
        const initialBlock = dragState.initialBlockState;
        let newWidth = initialBlock.width;
        let newHeight = initialBlock.height;
        let newX = initialBlock.x;
        let newY = initialBlock.y;

        switch (dragState.resizeHandle) {
          case 'se':
            newWidth = Math.max(100, initialBlock.width + totalDeltaX / scale);
            newHeight = Math.max(60, initialBlock.height + totalDeltaY / scale);
            break;
          case 'sw':
            newWidth = Math.max(100, initialBlock.width - totalDeltaX / scale);
            newHeight = Math.max(60, initialBlock.height + totalDeltaY / scale);
            newX = initialBlock.x + (initialBlock.width - newWidth);
            break;
          case 'ne':
            newWidth = Math.max(100, initialBlock.width + totalDeltaX / scale);
            newHeight = Math.max(60, initialBlock.height - totalDeltaY / scale);
            newY = initialBlock.y + (initialBlock.height - newHeight);
            break;
          case 'nw':
            newWidth = Math.max(100, initialBlock.width - totalDeltaX / scale);
            newHeight = Math.max(60, initialBlock.height - totalDeltaY / scale);
            newX = initialBlock.x + (initialBlock.width - newWidth);
            newY = initialBlock.y + (initialBlock.height - newHeight);
            break;
        }

        updateBlock(selectedBlock, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        });
      }
    } else if (dragState.dragType === 'create' && dragState.createStart) {
      if (!dragState.isCreating && hasMovedEnough) {
        setDragState(prev => ({ ...prev, isCreating: true }));
      }
    }

    // Update last position for all non-canvas operations
    setDragState(prev => ({
      ...prev,
      lastPos: { x: currentX, y: currentY }
    }));
  }, [dragState, selectedBlock, roadmapData.blocks, updateBlock, scale, readOnly]);

  // Handle mouse up
  const handleMouseUp = useCallback((event: MouseEvent) => {
    const wasActuallyDragging = dragState.isDragging;
    
    // Apply snap-to-grid only when movement is complete
    if (dragState.isDragging && selectedBlock) {
      const block = roadmapData.blocks.find(b => b.block_id === selectedBlock);
      if (block) {
        updateBlock(selectedBlock, {
          x: snapToGrid(block.x),
          y: snapToGrid(block.y)
        });
      }
    }

    // Handle drag-to-create completion
    if (dragState.dragType === 'create' && dragState.createStart && dragState.isCreating) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const startX = (dragState.createStart.x - canvasRect.left - canvasOffset.x) / scale;
        const startY = (dragState.createStart.y - canvasRect.top - canvasOffset.y) / scale;
        const endX = (event.clientX - canvasRect.left - canvasOffset.x) / scale;
        const endY = (event.clientY - canvasRect.top - canvasOffset.y) / scale;

        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        if (width > 20 && height > 20) { // Minimum size threshold
          const blockId = createBlock(
            Math.min(startX, endX) * scale + canvasRect.left + canvasOffset.x,
            Math.min(startY, endY) * scale + canvasRect.top + canvasOffset.y,
            width,
            height
          );
          if (blockId) {
            setSelectedBlock(blockId);
            setShowRightPanel(true);
          }
        }
        
        // Exit create mode after creating a block
        setCreateMode(false);
      }
    }

    // Only open right panel if this was a click (not a drag or resize)
    if (dragState.dragType === 'move' && selectedBlock && !wasActuallyDragging) {
      // Toggle panel if clicking the same block, or open if different block
      if (showRightPanel && selectedBlockData && selectedBlockData.block_id === selectedBlock) {
        setShowRightPanel(false);
        setSelectedBlock(null);
      } else {
        setShowRightPanel(true);
      }
    }

    setDragState({
      isDragging: false,
      isResizing: false,
      isCreating: false,
      dragType: null,
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 }
    });
  }, [dragState, canvasOffset, scale, createBlock, selectedBlock, roadmapData.blocks, updateBlock, snapToGrid, showRightPanel, selectedBlockData]);

  // Add mouse event listeners
  useEffect(() => {
    if (dragState.dragType) {
      // Use passive listeners for better performance
      const options = { passive: false };
      document.addEventListener('mousemove', handleMouseMove, options);
      document.addEventListener('mouseup', handleMouseUp, options);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.dragType, handleMouseMove, handleMouseUp]);
  
  // Handle connection point click
  const handleConnectionPointClick = useCallback((blockId: string, side: 'top' | 'right' | 'bottom' | 'left', event: React.MouseEvent) => {
    if (!connectionMode) return;
    
    event.stopPropagation();
    
    if (!connectionStart) {
      setConnectionStart(blockId);
    } else if (connectionStart !== blockId) {
      // Save history before creating connection
      pushHistory(roadmapData);
      
      // Create connection
      setRoadmapData(prev => ({
        ...prev,
        blocks: prev.blocks.map(block => {
          if (block.block_id === connectionStart) {
            const connectionValue = side === 'top' ? 'up' : side === 'right' ? 'right' : side === 'bottom' ? 'bottom' : 'left';
            // Use composite key: targetBlockId:sourceDirection->targetDirection
            // For click-based connections, we need to determine the source direction
            const sourceDirection = 'right'; // Default for click-based connections, could be enhanced
            const fullConnectionValue = `${sourceDirection}->${connectionValue}`;
            const connectionKey = `${blockId}:${fullConnectionValue}`;
            

            
            return {
              ...block,
              connected_blocks: {
                ...block.connected_blocks,
                [connectionKey]: fullConnectionValue
              }
            };
          }
          return block;
        })
      }));
      setConnectionStart(null);
    } else {
      setConnectionStart(null);
    }
  }, [connectionMode, connectionStart, roadmapData, pushHistory]);

  // Handle connection arrow drag start
  const handleConnectionArrowMouseDown = useCallback((blockId: string, direction: 'up' | 'right' | 'bottom' | 'left', event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Save history before starting connection drag
    pushHistory(roadmapData);
    
    const newState = {
      isConnecting: true,
      sourceBlockId: blockId,
      sourceDirection: direction,
      currentPos: { x: event.clientX, y: event.clientY },
      targetBlockId: null,
      targetDirection: null
    };
    connectionDragStateRef.current = newState;
    setConnectionDragState(newState);
  }, [roadmapData, pushHistory]);

  // Handle connection click
  const handleConnectionClick = useCallback((fromBlockId: string, toBlockId: string, direction: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const connectionId = `${fromBlockId}-${toBlockId}-${direction}`;
    
    // Only clear block selection on single click (not Ctrl/Cmd or Shift)
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
      setSelectedBlocks([]);
      setSelectedBlock(null);
    }
    
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection for this connection
      setSelectedConnections(prev => 
        prev.includes(connectionId) 
          ? prev.filter(id => id !== connectionId)
          : [...prev, connectionId]
      );
      setShowConnectionPanel(false);
    } else if (event.shiftKey && selectedConnections.length > 0) {
      // Range select: select all connections between last and current
      const allConnections = roadmapData.blocks.flatMap(block =>
        Object.entries(block.connected_blocks).map(([connectionKey, direction]) => {
          // Parse composite key to get target ID and direction
          let targetId: string;
          let parsedDirection: string;
          
          if (connectionKey.includes(':')) {
            // New composite key format
            const [actualTargetId, connectionValue] = connectionKey.split(':');
            targetId = actualTargetId;
            parsedDirection = connectionValue;
          } else {
            // Legacy format
            targetId = connectionKey;
            parsedDirection = direction as string;
          }
          
          return `${block.block_id}-${targetId}-${parsedDirection}`;
        })
      );
      const last = allConnections.indexOf(selectedConnections[selectedConnections.length - 1]);
      const curr = allConnections.indexOf(connectionId);
      if (last !== -1 && curr !== -1) {
        const [start, end] = [last, curr].sort((a, b) => a - b);
        const range = allConnections.slice(start, end + 1);
        setSelectedConnections(Array.from(new Set([...selectedConnections, ...range])));
      }
      setShowConnectionPanel(false);
    } else {
      // Single selection
      setSelectedConnections([connectionId]);
      setShowConnectionPanel(true); // Show panel for single selection
    }
    setShowRightPanel(false);
  }, [roadmapData.blocks, selectedConnections]);

  // Delete selected connections
  const deleteSelectedConnections = useCallback(() => {
    if (selectedConnections.length === 0) return;

    
    // Parse connection ID format: sourceBlockId-targetBlockId-connectionDirection
    const parseConnectionId = (id: string) => {
      // Connection ID format: sourceUUID-targetUUID-direction
      // UUIDs are 36 characters long with dashes
      // So we can extract: first 36 chars = sourceId, next 36 chars = targetId, rest = direction
      if (id.length > 73) { // 36 + 1 + 36 + 1 + direction
        const sourceId = id.substring(0, 36);
        const targetId = id.substring(37, 73);
        const direction = id.substring(74);
        return { fromId: sourceId, toId: targetId, direction };
      } else {
        // Legacy format: sourceBlockId-targetBlockId (72 chars + 1 dash)
        return {
          fromId: id.substring(0, 36),
          toId: id.substring(37, 73),
          direction: null
        };
      }
    };

    setRoadmapData(prev => {

      
      const updatedBlocks = prev.blocks.map(block => {
        const remainingConnections = { ...block.connected_blocks };
        selectedConnections.forEach(connId => {
          const { fromId, toId, direction } = parseConnectionId(connId);
          
          if (block.block_id === fromId) {
            
            if (direction) {
              // New format: find and remove the specific connection key
              const connectionKey = `${toId}:${direction}`;

              
              if (remainingConnections[connectionKey]) {
                delete remainingConnections[connectionKey];
              } else {
                // Try to find any key that contains the target ID
                
                // Check if it's stored in legacy format (just target ID as key)
                if (remainingConnections[toId] && remainingConnections[toId] === direction) {
                  delete remainingConnections[toId];
                } else {
                }
              }
            } else {
              // Legacy format: remove by target ID
              delete remainingConnections[toId];
            }
            
          }
        });
        return { ...block, connected_blocks: remainingConnections };
      });
      
      
      return { ...prev, blocks: updatedBlocks };
    });
    setSelectedConnections([]);
  }, [selectedConnections, roadmapData]);


  // Keyboard shortcuts
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // DELETE
      if (e.key === 'Delete') {
        if (selectedConnections.length) deleteSelectedConnections();
        if (selectedBlocks.length) deleteSelectedBlocks();
      }

      // SELECT ALL
      if (isMod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedBlocks(roadmapData.blocks.map(b => b.block_id));
        setSelectedConnections(
          roadmapData.blocks.flatMap(b => 
            Object.entries(b.connected_blocks).map(([connectionKey, direction]) => {
              // Parse composite key to get target ID and direction
              let targetId: string;
              let parsedDirection: string;
              
              if (connectionKey.includes(':')) {
                // New composite key format
                const [actualTargetId, connectionValue] = connectionKey.split(':');
                targetId = actualTargetId;
                parsedDirection = connectionValue;
              } else {
                // Legacy format
                targetId = connectionKey;
                parsedDirection = direction as string;
              }
              
              return `${b.block_id}-${targetId}-${parsedDirection}`;
            })
          )
        );
        setShowRightPanel(false);
        setShowConnectionPanel(false);
      }

      // ESC deselect
      if (e.key === 'Escape') {
        setSelectedBlocks([]);
        setSelectedConnections([]);
        setShowRightPanel(false);
        setShowConnectionPanel(false);
        setSelectedBlock(null);
      }

      // DUPLICATE
      if (isMod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (!selectedBlocks.length) return;
        setRoadmapData(prev => {
          const clones = selectedBlocks.map(id => {
            const orig = prev.blocks.find(b => b.block_id === id);
            if (!orig) return null;
            return { ...orig, block_id: uuidv4(), x: orig.x + 40, y: orig.y + 40, connected_blocks: {} };
          }).filter(Boolean) as RoadmapBlock[];
          return { ...prev, blocks: [...prev.blocks, ...clones] };
        });
      }

      // COPY
      if (isMod && e.key.toLowerCase() === 'c') {
        if (selectedBlocks.length) {
          setCopiedBlocks(roadmapData.blocks.filter(b => selectedBlocks.includes(b.block_id)).map(b => ({ ...b })));
        }
      }

      // PASTE
      if (isMod && e.key.toLowerCase() === 'v') {
        if (copiedBlocks.length) {
          setRoadmapData(prev => {
            const clones = copiedBlocks.map(orig => ({ ...orig, block_id: uuidv4(), x: orig.x + 40, y: orig.y + 40, connected_blocks: {} }));
            setSelectedBlocks(clones.map(b => b.block_id));
            return { ...prev, blocks: [...prev.blocks, ...clones] };
          });
        }
      }

      // UNDO / REDO
      if (isMod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if (isMod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }

      // ARROW MOVE
      if (selectedBlocks.length && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        setRoadmapData(prev => ({
          ...prev,
          blocks: prev.blocks.map(block => {
            if (!selectedBlocks.includes(block.block_id)) return block;
            switch (e.key) {
              case 'ArrowUp': return { ...block, y: block.y - delta * GRID_SIZE };
              case 'ArrowDown': return { ...block, y: block.y + delta * GRID_SIZE };
              case 'ArrowLeft': return { ...block, x: block.x - delta * GRID_SIZE };
              case 'ArrowRight': return { ...block, x: block.x + delta * GRID_SIZE };
              default: return block;
            }
          })
        }));
      }
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [selectedBlocks, selectedConnections, roadmapData.blocks, copiedBlocks, deleteSelectedBlocks, deleteSelectedConnections, undo, redo]);

  // Move these above their first use
  // --- Path Generators ---
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

  // Improved orthogonal path generator with obstacle avoidance & rounded corners
  const generateOrthogonalPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    direction: 'up' | 'bottom' | 'right' | 'left',
    targetDirection: 'up' | 'bottom' | 'right' | 'left',
    sourceBlockId?: string,
    targetBlockId?: string
  ) => {
    const offset = 20;

    // Helper: rectangle intersection check for axis-aligned segment
    const segmentIntersectsRect = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      rect: { x: number; y: number; width: number; height: number }
    ) => {
      if (x1 === x2) {
        // vertical segment
        const x = x1;
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return x >= rect.x && x <= rect.x + rect.width && maxY >= rect.y && minY <= rect.y + rect.height;
      }
      if (y1 === y2) {
        // horizontal segment
        const y = y1;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        return y >= rect.y && y <= rect.y + rect.height && maxX >= rect.x && minX <= rect.x + rect.width;
      }
      return false; // should not happen – segments are axis-aligned
    };

    // Build obstacle list (pixel coords)
    const obstacles = roadmapData.blocks
      .filter(b => b.block_id !== sourceBlockId && b.block_id !== targetBlockId)
      .map(b => ({
        x: (b.x + canvasOffsetRef.current.x) * scale,
        y: (b.y + canvasOffsetRef.current.y) * scale,
        width: b.width * scale,
        height: b.height * scale
      }));

    // Function to test a polyline path for collisions
    const isPathClear = (pts: { x: number; y: number }[]) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        for (const ob of obstacles) {
          if (segmentIntersectsRect(a.x, a.y, b.x, b.y, ob)) return false;
        }
      }
      return true;
    };

    // Helper to build rounded path string
    const buildRoundedPath = (pts: { x: number; y: number }[], radius: number) => {
      if (pts.length < 2) return '';
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const next = pts[i + 1];
        if (!next) {
          d += ` L ${curr.x} ${curr.y}`;
        } else {
          // shorten segment
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

    // Compute exit (p1) & entry (pLast-1) points
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

    // Try primary orientation first (based on start direction)
    const horizontalFirst = direction === 'left' || direction === 'right';
    const candidateA: { x: number; y: number }[] = horizontalFirst
      ? [ { x: startX, y: startY }, p1, { x: pLastMinus1.x, y: p1.y }, pLastMinus1, { x: endX, y: endY } ]
      : [ { x: startX, y: startY }, p1, { x: p1.x, y: pLastMinus1.y }, pLastMinus1, { x: endX, y: endY } ];

    if (isPathClear(candidateA)) {
      return buildRoundedPath(candidateA, 8);
    }

    // Secondary orientation
    const candidateB: { x: number; y: number }[] = !horizontalFirst
      ? [ { x: startX, y: startY }, p1, { x: pLastMinus1.x, y: p1.y }, pLastMinus1, { x: endX, y: endY } ]
      : [ { x: startX, y: startY }, p1, { x: p1.x, y: pLastMinus1.y }, pLastMinus1, { x: endX, y: endY } ];

    if (isPathClear(candidateB)) {
      return buildRoundedPath(candidateB, 8);
    }

    // Fallback: extend offset further outward until clear (simple loop)
    let extra = offset + 20;
    for (let i = 0; i < 5; i++) {
      const p1Extra = { ...p1 };
      if (direction === 'up' || direction === 'bottom') p1Extra.x += (i % 2 === 0 ? 1 : -1) * extra;
      else p1Extra.y += (i % 2 === 0 ? 1 : -1) * extra;
      const pathPts = horizontalFirst
        ? [ { x: startX, y: startY }, p1Extra, { x: pLastMinus1.x, y: p1Extra.y }, pLastMinus1, { x: endX, y: endY } ]
        : [ { x: startX, y: startY }, p1Extra, { x: p1Extra.x, y: pLastMinus1.y }, pLastMinus1, { x: endX, y: endY } ];
      if (isPathClear(pathPts)) {
        return buildRoundedPath(pathPts, 8);
      }
      extra += 20;
    }

    // As last resort, straight line
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  };

  const generateConnectionPath = (
    startX: number, startY: number, endX: number, endY: number,
    direction: 'up' | 'bottom' | 'right' | 'left', targetDirection: 'up' | 'bottom' | 'right' | 'left',
    curve: 'curved' | 'straight' | 'orthogonal', sourceBlockId?: string, targetBlockId?: string
  ) => {
    if (curve === 'straight') {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    } else if (curve === 'orthogonal') {
      return generateOrthogonalPath(startX, startY, endX, endY, direction, targetDirection, sourceBlockId, targetBlockId);
    } else {
      return generateCurvedPath(startX, startY, endX, endY, direction, targetDirection);
    }
  };

  // Move these above their first use
  const handleConnectionMouseMove = React.useCallback((event: MouseEvent) => {
    const drag = connectionDragStateRef.current;
    if (!drag.isConnecting) return;
    const currentPos = { x: event.clientX, y: event.clientY };
    // Detect if hovering over a block
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      const mouseX = (event.clientX - canvasRect.left - canvasOffsetRef.current.x) / scale;
      const mouseY = (event.clientY - canvasRect.top - canvasOffsetRef.current.y) / scale;
      let targetBlockId: string | null = null;
      let targetDirection: 'up' | 'bottom' | 'right' | 'left' | null = null;
      for (const block of roadmapData.blocks) {
        if (block.block_id === drag.sourceBlockId) continue;
        if (
          mouseX >= block.x &&
          mouseX <= block.x + block.width &&
          mouseY >= block.y &&
          mouseY <= block.y + block.height
        ) {
          targetBlockId = block.block_id;
          const centerX = block.x + block.width / 2;
          const centerY = block.y + block.height / 2;
          const deltaX = mouseX - centerX;
          const deltaY = mouseY - centerY;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);
          if (absX > absY) {
            targetDirection = deltaX > 0 ? 'right' : 'left';
          } else {
            targetDirection = deltaY > 0 ? 'bottom' : 'up';
          }
          break;
        }
      }
      const updated = { ...drag, currentPos, targetBlockId, targetDirection } as typeof drag;
      connectionDragStateRef.current = updated;
      setConnectionDragState(updated);
    } else {
      const updated = { ...drag, currentPos } as typeof drag;
      connectionDragStateRef.current = updated;
      setConnectionDragState(updated);
    }
  }, [canvasOffset, scale, roadmapData.blocks]);
  
  const handleConnectionMouseUp = React.useCallback((event: MouseEvent) => {
    const drag = connectionDragStateRef.current;
    if (!drag.isConnecting) return;

    let targetId = drag.targetBlockId;
    let targetDir = drag.targetDirection;

    // If not determined during drag, compute now based on mouse-up position
    if (!targetId || !targetDir) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const canvasX = (event.clientX - canvasRect.left - canvasOffsetRef.current.x) / scale;
        const canvasY = (event.clientY - canvasRect.top - canvasOffsetRef.current.y) / scale;
        const res = findTargetBlock(canvasX, canvasY, drag.sourceBlockId || undefined);
        if (res) {
          targetId = res.id;
          targetDir = res.dir;
        }
      }
    }

    if (targetId && targetDir && drag.sourceBlockId && drag.sourceDirection && targetId !== drag.sourceBlockId) {
      const connectionValue = `${drag.sourceDirection}->${targetDir}`;
      // Use composite key: targetBlockId:sourceDirection->targetDirection
      const connectionKey = `${targetId}:${connectionValue}`;
      
      setRoadmapData(prev => ({
        ...prev,
        blocks: prev.blocks.map(block => {
          if (block.block_id === drag.sourceBlockId) {

            
            return {
              ...block,
              connected_blocks: {
                ...block.connected_blocks,
                [connectionKey]: connectionValue
              }
            };
          }
          return block;
        })
      }));
    }
    
    setConnectionDragState({
      isConnecting: false,
      sourceBlockId: null,
      sourceDirection: null,
      currentPos: { x: 0, y: 0 },
      targetBlockId: null,
      targetDirection: null
    });
  }, [setRoadmapData, scale]);

  // Canvas click to deselect
  const handleContainerClick = React.useCallback((_event: React.MouseEvent) => {
    setSelectedBlocks([]);
    setSelectedConnections([]);
    setShowRightPanel(false);
    setShowConnectionPanel(false);
    setSelectedBlock(null);
  }, []);

  // Toggle create mode
  const toggleCreateMode = React.useCallback(() => {
    setCreateMode(prev => !prev);
    setConnectionMode(false);
  }, []);

  // Save handler
  const handleSave = React.useCallback(() => {
    const convertedData = {
      blocks: roadmapData.blocks.map(block => ({
        block_id: block.block_id,
        left_coordinate: block.x,
        up_coordinate: block.y,
        right_coordinate: block.x + block.width,
        down_coordinate: block.y + block.height,
        color: block.color,
        inner_label: block.inner_label,
        outer_label: block.outer_label,
        outer_label_direction: block.outer_label_direction,
        html_content: block.html_content,
        connected_blocks: block.connected_blocks,
        connection_styles: block.connection_styles
      }))
    };
    onSave(JSON.stringify(convertedData));
  }, [roadmapData, onSave]);

  // Canvas mouse down
  const handleCanvasMouseDown = React.useCallback((event: React.MouseEvent) => {
    const isCanvasClick = event.target === event.currentTarget || (event.target as Element)?.classList?.contains('pointer-events-auto');
    if (isCanvasClick) {
      pushHistory(roadmapData);
      setSelectedBlock(null);
      setSelectedConnections([]);
      setShowRightPanel(false);
      if (createMode && !readOnly) {
        setDragState({
          isDragging: false,
          isResizing: false,
          isCreating: false,
          dragType: 'create',
          startPos: { x: event.clientX, y: event.clientY },
          currentPos: { x: event.clientX, y: event.clientY },
          createStart: { x: event.clientX, y: event.clientY },
          lastPos: { x: event.clientX, y: event.clientY }
        });
      } else {
        setDragState({
          isDragging: false,
          isResizing: false,
          isCreating: false,
          dragType: 'canvas',
          startPos: { x: event.clientX, y: event.clientY },
          currentPos: { x: event.clientX, y: event.clientY },
          lastPos: { x: event.clientX, y: event.clientY }
        });
      }
    }
  }, [createMode, readOnly, roadmapData, pushHistory]);

  // Restore connection drag event listener
  useEffect(() => {
    if (connectionDragState.isConnecting) {
      const opts = { passive: false } as AddEventListenerOptions;
      document.addEventListener('mousemove', handleConnectionMouseMove, opts);
      document.addEventListener('mouseup', handleConnectionMouseUp, opts);
      return () => {
        document.removeEventListener('mousemove', handleConnectionMouseMove);
        document.removeEventListener('mouseup', handleConnectionMouseUp);
      };
    }
  }, [connectionDragState.isConnecting, handleConnectionMouseMove, handleConnectionMouseUp]);

  // Keep latest connection drag state in a ref for reliable access inside event listeners
  const connectionDragStateRef = useRef(connectionDragState);
  useEffect(() => {
    connectionDragStateRef.current = connectionDragState;
  }, [connectionDragState]);

  // Utility: locate block (and edge) under given canvas-space coords
  function findTargetBlock(canvasX: number, canvasY: number, excludeId?: string): { id: string; dir: 'up' | 'bottom' | 'right' | 'left' } | null {
    for (const block of roadmapData.blocks) {
      if (block.block_id === excludeId) continue;
      if (canvasX >= block.x && canvasX <= block.x + block.width && canvasY >= block.y && canvasY <= block.y + block.height) {
        const centerX = block.x + block.width / 2;
        const centerY = block.y + block.height / 2;
        const dX = canvasX - centerX;
        const dY = canvasY - centerY;
        if (Math.abs(dX) > Math.abs(dY)) {
          return { id: block.block_id, dir: dX > 0 ? 'right' : 'left' };
        }
        return { id: block.block_id, dir: dY > 0 ? 'bottom' : 'up' };
      }
    }
    return null;
  }

  // --- Autosave --------------------------------------------------
  // Convert current roadmapData back to legacy save format
  const toSaveFormat = useCallback((data: RoadmapData) => ({
    blocks: data.blocks.map(block => ({
      block_id: block.block_id,
      left_coordinate: block.x,
      up_coordinate: block.y,
      right_coordinate: block.x + block.width,
      down_coordinate: block.y + block.height,
      color: block.color,
      inner_label: block.inner_label,
      outer_label: block.outer_label,
      outer_label_direction: block.outer_label_direction,
      html_content: block.html_content,
      connected_blocks: block.connected_blocks,
      connection_styles: block.connection_styles
    }))
  }), []);

  // Debounced autosave - only for existing roadmaps with roadmapId
  const autosaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (readOnly || !roadmapId) return; // Only autosave for existing roadmaps
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    autosaveTimeout.current = setTimeout(async () => {
      try {
        // Use the proper API service for updating existing roadmaps
        await roadmapAPI.update(roadmapId, {
          name,
          description,
          category_ids: categoryIds,
          roadmap: JSON.stringify(toSaveFormat(roadmapData))
        });
      } catch (e) {
        console.error('❌ Autosave failed', e);
      }
    }, 1000);
    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    };
  }, [roadmapData, toSaveFormat, readOnly, roadmapId, name, description, categoryIds]);

  // Close handler - saves before closing
  const handleClose = React.useCallback(() => {
    const convertedData = {
      blocks: roadmapData.blocks.map(block => ({
        block_id: block.block_id,
        left_coordinate: block.x,
        up_coordinate: block.y,
        right_coordinate: block.x + block.width,
        down_coordinate: block.y + block.height,
        color: block.color,
        inner_label: block.inner_label,
        outer_label: block.outer_label,
        outer_label_direction: block.outer_label_direction,
        html_content: block.html_content,
        connected_blocks: block.connected_blocks,
        connection_styles: block.connection_styles
      }))
    };
    onSave(JSON.stringify(convertedData));
  }, [roadmapData, onSave]);

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden flex" onClick={handleContainerClick}>
      {/* Left Toolbar */}
      {!readOnly && (
        <div className="absolute top-4 left-4 z-50 bg-white rounded-lg shadow-lg border p-3">
          <div className="flex flex-col space-y-3">
            {selectedBlocks.length > 1 && (
              <button
                onClick={deleteSelectedBlocks}
                className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                title="Delete Selected Blocks"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Delete Selected
              </button>
            )}
            <button
              onClick={toggleCreateMode}
              className={`p-3 rounded-lg transition-colors flex items-center justify-center ${
                createMode 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              title={createMode ? "Exit Create Mode" : "Create Block Mode"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {createMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                )}
              </svg>
            </button>
            
            <div className="border-t pt-3">
              <button
                onClick={() => setScale(prev => Math.max(0.25, prev - 0.25))}
                className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors w-full mb-1"
                title="Zoom Out"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <div className="text-xs text-center py-1 text-gray-500">
                {Math.round(scale * 100)}%
              </div>
              
              <button
                onClick={() => setScale(prev => Math.min(2, prev + 0.25))}
                className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors w-full"
                title="Zoom In"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleSave}
              className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
              title="Save"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 0V4a2 2 0 00-2-2H9a2 2 0 00-2 2v3m1 0h4" />
              </svg>
            </button>

            <button
              onClick={handleClose}
              className="p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
              title="Save & Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!readOnly && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg border px-4 py-2">
          <p className="text-sm text-gray-600">
            {createMode ? (
              <span className="text-green-600 font-medium">Create Mode: Click and drag to create blocks</span>
            ) : connectionMode ? (
              <span className="text-blue-600 font-medium">Connection Mode: Click edge midpoints to connect blocks</span>
            ) : (
              <span className="text-gray-500 font-medium">Visual Roadmap Builder</span>
            )}
          </p>
        </div>
      )}

      {/* Connection selection indicator */}
      {selectedConnections.length > 0 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-300 rounded-lg px-4 py-2">
          <p className="text-sm text-red-700">
            {selectedConnections.length} connection{selectedConnections.length > 1 ? 's' : ''} selected • Press <kbd className="px-2 py-1 bg-red-200 rounded text-xs">Delete</kbd> to remove
          </p>
        </div>
      )}

      {/* Main Canvas */}
      <div
        className={`flex-1 ${showRightPanel || showConnectionPanel ? 'mr-[500px]' : ''} transition-all duration-300 relative`}
        style={{ 
          cursor: createMode ? 'crosshair' : 
                 dragState.dragType === 'canvas' ? 'grabbing' : 
                 dragState.dragType === 'create' ? 'crosshair' : 'default' 
        }}
      >
        <div
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
            backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
            backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
            willChange: 'transform'
          }}
          onMouseDown={handleCanvasMouseDown}
        >
          {/* Drag-to-create preview */}
          {dragState.dragType === 'create' && dragState.isCreating && dragState.createStart && (
            <div
              className="absolute border-2 border-dashed border-green-500 bg-green-100 bg-opacity-30 pointer-events-none"
              style={{
                left: Math.min(dragState.createStart.x, dragState.currentPos.x) - (canvasRef.current?.getBoundingClientRect().left || 0),
                top: Math.min(dragState.createStart.y, dragState.currentPos.y) - (canvasRef.current?.getBoundingClientRect().top || 0),
                width: Math.abs(dragState.currentPos.x - dragState.createStart.x),
                height: Math.abs(dragState.currentPos.y - dragState.createStart.y),
                zIndex: 100
              }}
            />
          )}

          {/* Render connections with curves - Behind boxes */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 5 }}
            width="100%"
            height="100%"
          >
            {/* Connection preview line during drag */}
            {connectionDragState.isConnecting && connectionDragState.sourceBlockId && (() => {
              const sourceBlock = roadmapData.blocks.find(b => b.block_id === connectionDragState.sourceBlockId);
              if (!sourceBlock) return null;
              
              // Calculate source position based on direction
              let sourceX, sourceY;
              switch (connectionDragState.sourceDirection) {
                case 'up':
                  sourceX = (sourceBlock.x + sourceBlock.width / 2 + canvasOffset.x) * scale;
                  sourceY = (sourceBlock.y + canvasOffset.y) * scale;
                  break;
                case 'bottom':
                  sourceX = (sourceBlock.x + sourceBlock.width / 2 + canvasOffset.x) * scale;
                  sourceY = (sourceBlock.y + sourceBlock.height + canvasOffset.y) * scale;
                  break;
                case 'left':
                  sourceX = (sourceBlock.x + canvasOffset.x) * scale;
                  sourceY = (sourceBlock.y + sourceBlock.height / 2 + canvasOffset.y) * scale;
                  break;
                case 'right':
                  sourceX = (sourceBlock.x + sourceBlock.width + canvasOffset.x) * scale;
                  sourceY = (sourceBlock.y + sourceBlock.height / 2 + canvasOffset.y) * scale;
                  break;
                default:
                  return null;
              }
              
              const endX = connectionDragState.currentPos.x - (canvasRef.current?.getBoundingClientRect().left || 0);
              const endY = connectionDragState.currentPos.y - (canvasRef.current?.getBoundingClientRect().top || 0);
              
              // Default target direction for preview (will be overridden if hovering over a block)
              let targetDirection: 'up' | 'bottom' | 'right' | 'left' = 'right';
              if (connectionDragState.targetBlockId && connectionDragState.targetDirection) {
                // Correct target direction - opposite of the edge we're approaching
                switch (connectionDragState.targetDirection) {
                  case 'up': targetDirection = 'bottom'; break;
                  case 'bottom': targetDirection = 'up'; break;
                  case 'left': targetDirection = 'right'; break;
                  case 'right': targetDirection = 'left'; break;
                }
              }
              
              return (
                <path
                  d={generateCurvedPath(
                    sourceX, 
                    sourceY, 
                    endX, 
                    endY, 
                    connectionDragState.sourceDirection === 'up' ? 'up' : 
                    connectionDragState.sourceDirection === 'bottom' ? 'bottom' :
                    connectionDragState.sourceDirection === 'left' ? 'left' : 'right',
                    targetDirection
                  )}
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  fill="none"
                  opacity={0.8}
                  strokeLinecap="round"
                />
              );
            })()}
            
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

                const connectionId = `${block.block_id}-${targetId}-${parsedDirection}`;
                const isSelected = selectedConnections.includes(connectionId);
                const connectionStyle = getConnectionStyle(block.block_id, targetId);

                // Parse connection format: "sourceEdge->targetEdge" or legacy single edge
                let sourceEdge: 'up' | 'bottom' | 'right' | 'left';
                let targetEdge: 'up' | 'bottom' | 'right' | 'left';
                
                if (typeof parsedDirection === 'string' && parsedDirection.includes('->')) {
                  const [source, target] = parsedDirection.split('->');
                  sourceEdge = source as 'up' | 'bottom' | 'right' | 'left';
                  targetEdge = target as 'up' | 'bottom' | 'right' | 'left';
                } else {
                  // Legacy format - use old logic for backward compatibility
                  sourceEdge = parsedDirection as 'up' | 'bottom' | 'right' | 'left';
                  // For legacy connections, calculate target edge based on relative position
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

                // Calculate connection points based on direction
                let startX, startY, endX, endY;

                // Start point (from source block edge)
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

                // End point - use fixed target edge position
                let targetDirection: 'up' | 'bottom' | 'right' | 'left';
                
                switch (targetEdge) {
                  case 'up':
                    endX = (targetBlock.x + targetBlock.width / 2 + canvasOffsetRef.current.x) * scale;
                    endY = (targetBlock.y + canvasOffsetRef.current.y) * scale;
                    targetDirection = 'up'; // approach direction matches target edge for perpendicular entry
                    break;
                  case 'bottom':
                    endX = (targetBlock.x + targetBlock.width / 2 + canvasOffsetRef.current.x) * scale;
                    endY = (targetBlock.y + targetBlock.height + canvasOffsetRef.current.y) * scale;
                    targetDirection = 'bottom'; // approach direction matches target edge for perpendicular entry
                    break;
                  case 'left':
                    endX = (targetBlock.x + canvasOffsetRef.current.x) * scale;
                    endY = (targetBlock.y + targetBlock.height / 2 + canvasOffsetRef.current.y) * scale;
                    targetDirection = 'left'; // approach direction matches target edge for perpendicular entry
                    break;
                  case 'right':
                    endX = (targetBlock.x + targetBlock.width + canvasOffsetRef.current.x) * scale;
                    endY = (targetBlock.y + targetBlock.height / 2 + canvasOffsetRef.current.y) * scale;
                    targetDirection = 'right'; // approach direction matches target edge for perpendicular entry
                    break;
                  default:
                    endX = (targetBlock.x + targetBlock.width / 2 + canvasOffsetRef.current.x) * scale;
                    endY = (targetBlock.y + targetBlock.height / 2 + canvasOffsetRef.current.y) * scale;
                    targetDirection = 'right';
                }

                // Generate path based on connection style
                const pathData = generateConnectionPath(
                  startX, 
                  startY, 
                  endX, 
                  endY, 
                  sourceEdge, 
                  targetDirection, 
                  connectionStyle.curve,
                  block.block_id,
                  targetId
                );

                // Calculate stroke dash array based on style
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
                  <g key={connectionId}>
                    {/* Invisible thicker path for easier clicking */}
                    <path
                      d={pathData}
                      stroke="transparent"
                      strokeWidth={20}
                      fill="none"
                      style={{ pointerEvents: 'all', cursor: 'pointer' }}
                      onClick={(e) => handleConnectionClick(block.block_id, targetId, parsedDirection, e as any)}
                    />
                    {/* Visible connection line */}
                    <path
                      d={pathData}
                      stroke={isSelected ? "#EF4444" : connectionStyle.color}
                      strokeWidth={isSelected ? connectionStyle.weight + 2 : connectionStyle.weight}
                      strokeDasharray={getStrokeDashArray(connectionStyle.style, connectionStyle.weight, connectionStyle.dashGap)}
                      fill="none"
                      opacity={isSelected ? 1 : 0.9}
                      strokeLinecap="round"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        pointerEvents: 'none'
                      }}
                    />
                  </g>
                );
              })
            ).flat()}
          </svg>

          {/* Render blocks */}
          {roadmapData.blocks.map(block => (
            <BlockComponent
              key={`${block.block_id}-${renderTrigger}`}
              block={block}
              scale={scale}
              offset={canvasOffset}
              canvasOffsetRef={canvasOffsetRef}
              isSelected={selectedBlocks.includes(block.block_id)}
              onSelect={handleBlockSelect}
              onMouseDown={handleBlockMouseDown}
              onDelete={() => deleteBlock(block.block_id)}
              onConnectionPointClick={handleConnectionPointClick}
              onConnectionArrowMouseDown={handleConnectionArrowMouseDown}
              readOnly={readOnly}
              isDragging={dragState.isDragging && selectedBlock === block.block_id}
              isResizing={dragState.isResizing && selectedBlock === block.block_id}
              connectionMode={connectionMode}
              connectionStart={connectionStart}
            />
          ))}
        </div>
      </div>

      {/* Right Panel */}
      {showRightPanel && selectedBlockData && (
        <RightPanel
          block={selectedBlockData}
          onUpdate={(updates) => updateBlock(selectedBlockData.block_id, updates)}
          onClose={() => {
            setShowRightPanel(false);
            setSelectedBlock(null);
          }}
        />
      )}

      {/* Connection Panel */}
      {showConnectionPanel && selectedConnections.length === 1 && (() => {
        // Parse connection ID format: sourceBlockId-targetBlockId-connectionDirection
        const connectionId = selectedConnections[0];
        let fromBlockId: string;
        let toBlockId: string;
        
        // Connection ID format: sourceUUID-targetUUID-direction
        // UUIDs are 36 characters long with dashes
        if (connectionId.length > 73) { // 36 + 1 + 36 + 1 + direction
          fromBlockId = connectionId.substring(0, 36);
          toBlockId = connectionId.substring(37, 73);
        } else {
          // Legacy format: sourceBlockId-targetBlockId (72 chars + 1 dash)
          fromBlockId = connectionId.substring(0, 36);
          toBlockId = connectionId.substring(37, 73);
        }
        
        const fromBlock = roadmapData.blocks.find(b => b.block_id === fromBlockId);
        const toBlock = roadmapData.blocks.find(b => b.block_id === toBlockId);
        const connectionStyle = getConnectionStyle(fromBlockId, toBlockId);
        
        if (!fromBlock || !toBlock) return null;

        return (
          <ConnectionPanel
            connectionId={selectedConnections[0]}
            fromBlockLabel={fromBlock.inner_label}
            toBlockLabel={toBlock.inner_label}
            style={connectionStyle}
            onUpdate={(updates) => updateConnectionStyle(fromBlockId, toBlockId, updates)}
            onClose={() => {
              setShowConnectionPanel(false);
              setSelectedConnections([]);
            }}
            onDelete={() => {
              deleteSelectedConnections();
              setShowConnectionPanel(false);
              setSelectedConnections([]);
            }}
          />
        );
      })()}
    </div>
  );
};

export default RoadmapBuilder; 