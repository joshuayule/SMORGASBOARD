import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import Color from 'color';
import { PaletteColor } from '../types';

interface ColorWheelViewProps {
  palette: PaletteColor[];
  isDarkMode: boolean;
  onUpdate: (index: number, updates: Partial<PaletteColor>) => void;
  onBaseColorChange?: (hex: string) => void;
}

export const ColorWheelView: React.FC<ColorWheelViewProps> = ({ 
  palette, 
  isDarkMode, 
  onUpdate,
  onBaseColorChange 
}) => {
  const radius = 180;
  const center = 200;
  const size = 400;
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [localPos, setLocalPos] = useState<{ x: number, y: number } | null>(null);
  const dragRef = useRef<{ index: number; startColor: any } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) setIsAltPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey) setIsAltPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const colorNodes = useMemo(() => {
    return palette.map((color, index) => {
      // If this node is being dragged, use the local position to prevent jitter
      if (localPos && activeNode === index) {
        return {
          ...color,
          index,
          x: localPos.x,
          y: localPos.y,
          hue: 0, // Not strictly needed for rendering when using x,y
          saturation: 0,
          value: Color(color.hex).value()
        };
      }

      const c = Color(color.hex);
      const hue = c.hue();
      const saturation = c.saturationv();
      const angle = (hue - 90) * (Math.PI / 180);
      
      const dist = (saturation / 100) * radius;
      const x = center + dist * Math.cos(angle);
      const y = center + dist * Math.sin(angle);
      
      return {
        ...color,
        index,
        x,
        y,
        hue,
        saturation,
        value: c.value()
      };
    });
  }, [palette, radius, center, localPos, activeNode]);

  const handleInteraction = useCallback((index: number, point: { x: number, y: number }) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = point.x;
    pt.y = point.y;
    
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgP = pt.matrixTransform(ctm.inverse());
    
    // Update local position for smooth rendering
    setLocalPos({ x: svgP.x, y: svgP.y });

    const dx = svgP.x - center;
    const dy = svgP.y - center;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    const currentColor = dragRef.current?.index === index 
      ? dragRef.current.startColor 
      : Color(palette[index].hex);
    
    if (isAltPressed) {
      const newSat = Math.max(0, Math.min(100, (dist / radius) * 100));
      const newColor = Color.hsv(currentColor.hue(), newSat, currentColor.value());
      onUpdate(index, { hex: newColor.hex() });
    } else {
      const newColor = Color.hsv(angle, currentColor.saturationv(), currentColor.value());
      if (index === 0 && onBaseColorChange) {
        onBaseColorChange(newColor.hex());
      } else {
        onUpdate(index, { hex: newColor.hex() });
      }
    }
  }, [palette, isAltPressed, onUpdate, onBaseColorChange, center, radius]);

  const handlePanStart = useCallback((index: number) => {
    setActiveNode(index);
    const node = colorNodes[index];
    setLocalPos({ x: node.x, y: node.y });
    dragRef.current = {
      index,
      startColor: Color(palette[index].hex)
    };
  }, [palette, colorNodes]);

  const handlePanEnd = useCallback(() => {
    setActiveNode(null);
    setLocalPos(null);
    dragRef.current = null;
  }, []);

  const handleWheel = useCallback((index: number, e: React.WheelEvent) => {
    e.preventDefault();
    const currentColor = Color(palette[index].hex);
    const value = currentColor.value();
    // Invert delta for more intuitive feel (scroll up = brighter)
    const delta = e.deltaY < 0 ? 2 : -2;
    const newValue = Math.max(0, Math.min(100, value + delta));
    const newColor = Color.hsv(currentColor.hue(), currentColor.saturationv(), newValue);
    onUpdate(index, { hex: newColor.hex() });
  }, [palette, onUpdate]);

  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-none border border-zinc-800 retro-shadow ${isDarkMode ? 'bg-[#111111]' : 'bg-white'} min-h-[500px] relative`}>
      {/* Bauhaus Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
        backgroundImage: `linear-gradient(${isDarkMode ? '#fff' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? '#fff' : '#000'} 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="relative w-full max-w-[460px] aspect-square z-10">
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${size} ${size}`} 
          className="w-full h-full overflow-visible touch-none"
        >
          {/* Hue Reference Ring */}
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill="none" 
            stroke={isDarkMode ? '#222' : '#f0f0f0'} 
            strokeWidth="2"
          />
          
          {/* Degree Markers */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
            const angle = (deg - 90) * (Math.PI / 180);
            const x1 = center + (radius - 5) * Math.cos(angle);
            const y1 = center + (radius - 5) * Math.sin(angle);
            const x2 = center + (radius + 5) * Math.cos(angle);
            const y2 = center + (radius + 5) * Math.sin(angle);
            return (
              <line 
                key={deg} 
                x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke={isDarkMode ? '#444' : '#ccc'} 
                strokeWidth="1" 
              />
            );
          })}

          {/* Harmony Ghost Lines */}
          <AnimatePresence>
            {activeNode !== null && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {colorNodes.map((node, i) => (
                  i !== activeNode && (
                    <line
                      key={`ghost-${i}`}
                      x1={colorNodes[activeNode].x}
                      y1={colorNodes[activeNode].y}
                      x2={node.x}
                      y2={node.y}
                      stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )
                ))}
              </motion.g>
            )}
          </AnimatePresence>

          {/* Lines to center */}
          {colorNodes.map((node, i) => (
            <motion.line
              key={`line-${i}`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              x1={center}
              y1={center}
              x2={node.x}
              y2={node.y}
              stroke={node.hex}
              strokeWidth={activeNode === i ? "3" : "1.5"}
              strokeOpacity={activeNode === i ? "0.8" : "0.4"}
              strokeDasharray={activeNode === i ? "none" : "4 2"}
            />
          ))}

          {/* Color Nodes */}
          {colorNodes.map((node, i) => (
            <motion.g
              key={`node-${i}`}
              onPanStart={() => handlePanStart(i)}
              onPan={(e, info) => handleInteraction(i, info.point)}
              onPanEnd={handlePanEnd}
              onWheel={(e) => handleWheel(i, e)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 + 0.3, type: 'spring', stiffness: 200 }}
              className="cursor-grab active:cursor-grabbing group"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={activeNode === i ? "18" : "14"}
                fill={node.hex}
                stroke={isDarkMode ? '#fff' : '#000'}
                strokeWidth={activeNode === i ? "3" : "2"}
                className="retro-shadow transition-all duration-200 group-hover:scale-110"
              />
              
              {/* Value (Brightness) Ring - Visual feedback for scroll */}
              <circle
                cx={node.x}
                cy={node.y}
                r={activeNode === i ? "22" : "18"}
                fill="none"
                stroke={node.hex}
                strokeWidth="2"
                strokeDasharray={`${(node.value / 100) * (2 * Math.PI * (activeNode === i ? 22 : 18))} 1000`}
                className="opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none"
                transform={`rotate(-90 ${node.x} ${node.y})`}
              />
              {i === 0 && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="4"
                  fill={isDarkMode ? '#000' : '#fff'}
                  className="pointer-events-none"
                />
              )}
              <rect
                x={node.x - 45}
                y={node.y - 38}
                width="90"
                height="20"
                fill={isDarkMode ? '#000' : '#fff'}
                stroke={isDarkMode ? '#444' : '#ccc'}
                strokeWidth="1"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <text
                x={node.x}
                y={node.y - 24}
                textAnchor="middle"
                className={`text-[11px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'fill-white' : 'fill-black'}`}
              >
                {node.name} • {node.hex.toUpperCase()}
              </text>
            </motion.g>
          ))}

          {/* Center Point */}
          <circle 
            cx={center} 
            cy={center} 
            r="6" 
            fill={isDarkMode ? '#fff' : '#000'} 
            className="retro-shadow"
          />
          <circle 
            cx={center} 
            cy={center} 
            r="2" 
            fill={isDarkMode ? '#000' : '#fff'} 
          />
        </svg>

        {/* Legend */}
        <div className="absolute -bottom-4 left-0 right-0 flex flex-nowrap overflow-x-auto no-scrollbar justify-center gap-4 px-4">
          {palette.map((color, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-none" style={{ backgroundColor: color.hex }} />
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{color.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-16 text-center max-w-sm">
        <h3 className={`text-sm font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Interactive Control Surface</h3>
        <div className="grid grid-cols-1 gap-2 text-[10px] text-gray-500 uppercase tracking-wider">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
            <span>Drag Node</span>
            <span className="text-zinc-400">Adjust Hue</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
            <span>Alt + Drag</span>
            <span className="text-zinc-400">Adjust Saturation</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
            <span>Scroll Node</span>
            <span className="text-zinc-400">Adjust Lightness</span>
          </div>
        </div>
        <p className="mt-4 text-[9px] text-gray-400 italic leading-relaxed">
          Dragging the primary node (first in palette) will rotate the entire harmony rule.
        </p>
      </div>
    </div>
  );
};
