import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Copy, Hash, MoreVertical, Layers } from 'lucide-react';
import Color from 'color';
import { PaletteColor } from '../types';

interface ColorSwatchProps {
  color: PaletteColor;
  index: number;
  isDarkMode: boolean;
  onUpdate: (index: number, updates: Partial<PaletteColor>) => void;
  onCopy: (hex: string, index: number) => void;
  isCopied: boolean;
  onGenerateShades: (hex: string) => void;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  index,
  isDarkMode,
  onUpdate,
  onCopy,
  isCopied,
  onGenerateShades
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(color.hex);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditValue(color.hex);
  }, [color.hex]);

  const handleToggleLock = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onUpdate(index, { isLocked: !color.isLocked });
  };

  const handleHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const c = Color(editValue);
      onUpdate(index, { hex: c.hex() });
      setIsEditing(false);
    } catch (err) {
      setEditValue(color.hex);
      setIsEditing(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowMenu(false);
  };

  const hslString = Color(color.hex).hsl().string();
  const cssVarString = `--color-${color.name.toLowerCase().replace(/\s+/g, '-')}: ${color.hex};`;
  const isColorDark = Color(color.hex).isDark();
  const textColor = isColorDark ? 'text-white' : 'text-black';
  const iconColor = isColorDark ? 'text-white' : 'text-black';
  const overlayBg = isColorDark ? 'bg-black/10' : 'bg-white/10';

  return (
    <motion.div
      layout
      className="relative group lg:h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsEditing(false);
      }}
      onContextMenu={handleContextMenu}
    >
      {color.role && (
        <div className="mb-1 text-left overflow-hidden">
          <span className={`block truncate text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-black'}`}>
            {color.role}
          </span>
        </div>
      )}
      <motion.div
        animate={{
          y: isHovered ? -8 : 0,
          scale: isHovered ? 1.02 : 1,
          boxShadow: isHovered 
            ? `0 20px 40px ${color.hex}33` 
            : '0 0 0 rgba(0,0,0,0)'
        }}
        className={`relative aspect-square lg:aspect-auto flex-1 w-full border border-zinc-800 rounded-none overflow-hidden cursor-crosshair retro-shadow transition-all duration-300 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
        onClick={(e) => {
          if (e.shiftKey) {
            handleToggleLock();
          } else {
            setIsEditing(true);
          }
        }}
      >
        {/* Color Fill */}
        <div 
          className="absolute inset-0 transition-colors duration-500"
          style={{ backgroundColor: color.hex }}
        />

        {/* Overlay Info */}
        <div className={`absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${overlayBg} backdrop-blur-[2px]`}>
          <div className="flex justify-between items-start">
            <button
              onClick={handleToggleLock}
              className={`p-2 rounded-none ${color.isLocked ? (isColorDark ? 'bg-white text-black' : 'bg-black text-white') : `${isColorDark ? 'bg-white/20' : 'bg-black/20'} ${textColor} hover:bg-white/40`} transition-all`}
            >
              {color.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(true);
              }}
              className={`p-2 rounded-none ${isColorDark ? 'bg-white/20' : 'bg-black/20'} ${textColor} hover:bg-white/40 transition-all`}
            >
              <MoreVertical size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {isEditing ? (
              <form onSubmit={handleHexSubmit} onClick={e => e.stopPropagation()}>
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={handleHexSubmit}
                  className={`w-full ${isColorDark ? 'bg-white text-black' : 'bg-black text-white'} font-mono text-sm font-black px-2 py-1 rounded-none outline-none border-2 ${isColorDark ? 'border-black' : 'border-white'}`}
                />
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className={`text-sm font-mono font-black ${textColor} ${isColorDark ? 'drop-shadow-lg' : ''} uppercase tracking-tight`}>
                  {color.hex}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(color.hex, index);
                  }}
                  className={`${iconColor} hover:opacity-70 transition-colors`}
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
            <div className={`text-[11px] sm:text-xs font-black ${textColor} uppercase tracking-widest truncate ${isColorDark ? 'drop-shadow-lg' : ''}`}>
              {color.name}
            </div>
          </div>
        </div>

        {/* Lock Indicator (Always visible if locked) */}
        {color.isLocked && !isHovered && (
          <div className={`absolute top-2 right-2 p-1 ${isColorDark ? 'bg-black/20 text-white' : 'bg-white/20 text-black'} backdrop-blur-sm`}>
            <Lock size={10} />
          </div>
        )}

        {/* Copied Feedback */}
        <AnimatePresence>
          {isCopied && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute inset-0 flex items-center justify-center ${isColorDark ? 'bg-black/40 text-white' : 'bg-white/40 text-black'} backdrop-blur-sm z-20`}
            >
              <span className="font-black text-xs uppercase tracking-widest">Copied!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute z-50 top-12 right-0 w-48 border border-zinc-800 retro-shadow p-1 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => copyToClipboard(color.hex)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              <Hash size={12} /> Copy HEX
            </button>
            <button 
              onClick={() => copyToClipboard(hslString)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              <Layers size={12} /> Copy HSL
            </button>
            <button 
              onClick={() => copyToClipboard(cssVarString)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              <Copy size={12} /> Copy CSS Var
            </button>
            <div className="h-[1px] bg-zinc-800 my-1" />
            <button 
              onClick={() => {
                handleToggleLock();
                setShowMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              {color.isLocked ? <Unlock size={12} /> : <Lock size={12} />} {color.isLocked ? 'Unlock' : 'Lock'} Color
            </button>
            <button 
              onClick={() => {
                onGenerateShades(color.hex);
                setShowMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              <Layers size={12} /> Generate Shades
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
