import { useMemo, useState, useRef, useEffect } from 'react';
import { GameState, CellState } from '../utils/ClassicGameTypes';
import { useTheme } from './ThemeContext';

interface MinimapProps {
  gameState: GameState | null;
  visible: boolean;
  size?: number;
  position?: { right: number; top: number };
}

export const Minimap: React.FC<MinimapProps> = ({
  gameState,
  visible,
  size = 150,
  position = { right: 20, top: 20 },
}) => {
  const { currentTheme } = useTheme();
  const [dragPosition, setDragPosition] = useState(position);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const minimapRef = useRef<HTMLDivElement>(null);

  // Handle dragging functionality
  useEffect(() => {
    if (!visible || !minimapRef.current) return;

    const minimapEl = minimapRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      // Only start drag when clicking on the title area or border
      const targetEl = e.target as HTMLElement;
      if (targetEl.classList.contains('minimap-header') || targetEl === minimapEl) {
        isDragging.current = true;
        dragStartPos.current = {
          x: e.clientX,
          y: e.clientY,
        };
        // Change cursor
        minimapEl.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      // Calculate new position
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      // Update drag start position
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
      };

      // Update position (right/top calculations)
      setDragPosition((prev) => ({
        right: Math.max(0, prev.right - deltaX), // Prevent negative values
        top: Math.max(0, prev.top + deltaY),
      }));
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        // Reset cursor
        minimapEl.style.cursor = '';
      }
    };

    // Add event listeners
    minimapEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Clean up event listeners
    return () => {
      minimapEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [visible]);

  // Create the minimap data based on game state
  const minimapData = useMemo(() => {
    if (!gameState || !visible) return null;

    const { grid, gridCols, gridRows, player, enemies } = gameState;

    // Calculate cell size based on the minimap size and grid dimensions
    const cellSize = size / Math.max(gridCols, gridRows);

    // Create minimap elements
    const cells = [];

    // Background
    const backgroundColor =
      currentTheme.name === 'Standard'
        ? '#000000'
        : currentTheme.name === 'Tron'
          ? '#000033'
          : '#001100';

    // Draw grid cells
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        const cellState = grid[y][x];
        let color;

        switch (cellState) {
          case CellState.UNCAPTURED:
            color =
              currentTheme.name === 'Standard'
                ? '#000000'
                : currentTheme.name === 'Tron'
                  ? '#000022'
                  : '#111111';
            break;
          case CellState.CAPTURED:
            color =
              currentTheme.name === 'Standard'
                ? '#00AAAA'
                : currentTheme.name === 'Tron'
                  ? '#0088FF'
                  : '#22AA22';
            break;
          case CellState.TRAIL:
            color =
              currentTheme.name === 'Standard'
                ? '#FF00FF'
                : currentTheme.name === 'Tron'
                  ? '#FF00FF'
                  : '#AAAA00';
            break;
        }

        // Add a cell representation with the appropriate color
        cells.push({
          x,
          y,
          color,
          type: 'cell',
        });
      }
    }

    // Add player dot
    cells.push({
      x: player.x,
      y: player.y,
      color:
        currentTheme.name === 'Standard'
          ? '#FFFFFF'
          : currentTheme.name === 'Tron'
            ? '#FFFF00'
            : '#00FF00',
      type: 'player',
    });

    // Add player direction indicator
    const directionColor =
      currentTheme.name === 'Standard'
        ? '#FFFFFF'
        : currentTheme.name === 'Tron'
          ? '#FFFF00'
          : '#00FF00';

    // Only add direction indicator if player is moving or has moved
    if (player.dx !== 0 || player.dy !== 0) {
      const dirSize = cellSize * 0.7;

      cells.push({
        x: player.x + player.dx * 0.7,
        y: player.y + player.dy * 0.7,
        color: directionColor,
        type: 'direction',
        dx: player.dx,
        dy: player.dy,
        size: dirSize,
      });
    }

    // Add enemy dots
    enemies.forEach((enemy) => {
      cells.push({
        x: enemy.x,
        y: enemy.y,
        color:
          currentTheme.name === 'Standard'
            ? '#FF0000'
            : currentTheme.name === 'Tron'
              ? '#FF0000'
              : '#AAAA22',
        type: 'enemy',
      });
    });

    return {
      cells,
      cellSize,
      gridCols,
      gridRows,
      backgroundColor,
      borderColor:
        currentTheme.name === 'Standard'
          ? '#444444'
          : currentTheme.name === 'Tron'
            ? '#0066CC'
            : '#00AA00',
    };
  }, [gameState, visible, size, currentTheme]);

  if (!visible || !minimapData) return null;

  return (
    <div
      ref={minimapRef}
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        right: `${dragPosition.right}px`,
        top: `${dragPosition.top}px`,
        backgroundColor: minimapData.backgroundColor,
        border: `2px solid ${minimapData.borderColor}`,
        overflow: 'hidden',
        boxShadow:
          currentTheme.name === 'Standard'
            ? '0 0 5px rgba(0,0,0,0.5)'
            : currentTheme.name === 'Tron'
              ? '0 0 10px #0066CC'
              : '0 0 10px #115511',
        zIndex: 10,
        cursor: 'grab',
      }}
    >
      {/* Minimap header for dragging */}
      <div
        className="minimap-header"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '12px',
          background: 'transparent',
          cursor: 'grab',
          zIndex: 5,
        }}
      />

      {minimapData.cells.map((item, index) => {
        let itemSize = minimapData.cellSize;

        if (item.type === 'player') {
          itemSize = minimapData.cellSize * 1.5;

          return (
            <div
              key={`${item.type}-${index}`}
              style={{
                position: 'absolute',
                left: item.x * minimapData.cellSize,
                top: item.y * minimapData.cellSize,
                width: itemSize,
                height: itemSize,
                backgroundColor: item.color,
                borderRadius: '50%',
                zIndex: 3,
                transform: 'translate(-25%, -25%)',
                boxShadow: `0 0 3px ${item.color}`,
              }}
            />
          );
        } else if (item.type === 'direction') {
          // Direction indicator (small triangle/arrow pointing in player's direction)
          const dx = item.dx as number;
          const dy = item.dy as number;
          const rotation =
            dx === 0 && dy === -1
              ? '0deg' // Up
              : dx === 1 && dy === 0
                ? '90deg' // Right
                : dx === 0 && dy === 1
                  ? '180deg' // Down
                  : dx === -1 && dy === 0
                    ? '270deg' // Left
                    : '0deg'; // Default

          return (
            <div
              key={`${item.type}-${index}`}
              style={{
                position: 'absolute',
                left: item.x * minimapData.cellSize,
                top: item.y * minimapData.cellSize,
                width: 0,
                height: 0,
                borderLeft: `${(item.size as number) / 2}px solid transparent`,
                borderRight: `${(item.size as number) / 2}px solid transparent`,
                borderBottom: `${item.size as number}px solid ${item.color}`,
                zIndex: 4,
                transform: `translate(-50%, -50%) rotate(${rotation})`,
                opacity: 0.8,
              }}
            />
          );
        } else if (item.type === 'enemy') {
          itemSize = minimapData.cellSize * 1.2;

          return (
            <div
              key={`${item.type}-${index}`}
              style={{
                position: 'absolute',
                left: item.x * minimapData.cellSize,
                top: item.y * minimapData.cellSize,
                width: itemSize,
                height: itemSize,
                backgroundColor: item.color,
                borderRadius: '50%',
                zIndex: 2,
                transform: 'translate(-25%, -25%)',
                boxShadow: `0 0 3px ${item.color}`,
              }}
            />
          );
        } else {
          // Normal cell
          return (
            <div
              key={`${item.type}-${index}`}
              style={{
                position: 'absolute',
                left: item.x * minimapData.cellSize,
                top: item.y * minimapData.cellSize,
                width: itemSize,
                height: itemSize,
                backgroundColor: item.color,
                zIndex: 1,
              }}
            />
          );
        }
      })}

      {/* Add minimap title */}
      <div
        className="minimap-header"
        style={{
          position: 'absolute',
          bottom: '2px',
          left: '5px',
          color: minimapData.borderColor,
          fontSize: '8px',
          fontFamily: 'monospace',
          opacity: 0.8,
          textShadow:
            currentTheme.name !== 'Standard' ? `0 0 2px ${minimapData.borderColor}` : 'none',
          cursor: 'grab',
        }}
      >
        MINIMAP (DRAG ME)
      </div>
    </div>
  );
};
