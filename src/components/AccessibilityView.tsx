import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Color from 'color';
import { PaletteColor } from '../types';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Eye, 
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface AccessibilityViewProps {
  palette: PaletteColor[];
  isDarkMode: boolean;
}

type ColorBlindnessType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

const DISABILITY_INFO: Record<ColorBlindnessType, string> = {
  none: 'Standard color vision where all three types of light-sensitive cones (red, green, blue) are present and functioning correctly.',
  protanopia: 'A form of red-blindness caused by the absence of red retinal photoreceptors. Reds appear dark or grey, while greens and yellows look similar.',
  deuteranopia: 'The most common form of color blindness, caused by the absence of green retinal photoreceptors. It makes distinguishing between red and green hues difficult.',
  tritanopia: 'A rare form of blue-yellow color blindness caused by the absence of blue retinal photoreceptors. Blues appear greenish, and yellows appear violet or grey.',
  achromatopsia: 'Total color blindness where no colors can be perceived due to non-functioning cones. The world is seen entirely in shades of grey, black, and white.',
};

export const AccessibilityView: React.FC<AccessibilityViewProps> = ({ palette, isDarkMode }) => {
  const getInitialColor = (role: string, fallbackIndex: number) => {
    return palette.find(c => c.role === role)?.hex || palette[fallbackIndex]?.hex || (fallbackIndex === 0 ? '#000000' : '#FFFFFF');
  };

  const [textColor, setTextColor] = useState(getInitialColor('Primary', 0));
  const [bgColor, setBgColor] = useState(getInitialColor('Background', palette.length - 1));
  const [simulation, setSimulation] = useState<ColorBlindnessType>('none');
  const [hoveredType, setHoveredType] = useState<ColorBlindnessType | null>(null);

  useEffect(() => {
    setTextColor(getInitialColor('Primary', 0));
    setBgColor(getInitialColor('Background', palette.length - 1));
  }, [palette]);

  const contrastInfo = useMemo(() => {
    try {
      const color1 = Color(textColor);
      const color2 = Color(bgColor);
      const ratio = color1.contrast(color2);
      
      const aaNormal = ratio >= 4.5;
      const aaLarge = ratio >= 3;
      const aaaNormal = ratio >= 7;
      const aaaLarge = ratio >= 4.5;

      // Suggest accessible alternative
      let suggestedText = textColor;
      let suggestedRatio = ratio;
      
      if (!aaNormal) {
        // Try to darken/lighten text to find a better ratio
        const isBgDark = Color(bgColor).isDark();
        let tempColor = Color(textColor);
        
        for (let i = 0; i < 20; i++) {
          tempColor = isBgDark ? tempColor.lighten(0.1) : tempColor.darken(0.1);
          const newRatio = tempColor.contrast(Color(bgColor));
          if (newRatio >= 4.5) {
            suggestedText = tempColor.hex();
            suggestedRatio = newRatio;
            break;
          }
        }
      }

      return {
        ratio: ratio.toFixed(2),
        aaNormal,
        aaLarge,
        aaaNormal,
        aaaLarge,
        suggestedText,
        suggestedRatio: suggestedRatio.toFixed(2)
      };
    } catch (e) {
      return null;
    }
  }, [textColor, bgColor]);

  const simulationFilters: Record<ColorBlindnessType, string> = {
    none: '',
    protanopia: 'url(#protanopia)',
    deuteranopia: 'url(#deuteranopia)',
    tritanopia: 'url(#tritanopia)',
    achromatopsia: 'url(#achromatopsia)',
  };

  return (
    <div className={`flex flex-col gap-8 p-6 rounded-none border border-zinc-800 retro-shadow ${isDarkMode ? 'bg-[#111111]' : 'bg-white'} min-h-[600px]`}>
      {/* SVG Filters for Color Blindness Simulation */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="achromatopsia">
            <feColorMatrix type="matrix" values="0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>

      <div className="flex flex-col gap-12">
        {/* Contrast Checker Section */}
        <div className="space-y-6 w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-none bg-zinc-900 text-white flex items-center justify-center">
              <RefreshCw size={16} />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest">Contrast Checker</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Text Color</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={textColor} 
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded-none border border-zinc-800 p-0 cursor-pointer"
                />
                <input 
                  type="text" 
                  value={textColor.toUpperCase()} 
                  onChange={(e) => setTextColor(e.target.value)}
                  className={`flex-1 px-3 py-2 text-xs font-mono border border-zinc-800 rounded-none ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-gray-50 text-black'}`}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {palette.map((c, i) => (
                  <button 
                    key={i} 
                    onClick={() => setTextColor(c.hex)}
                    className="w-6 h-6 rounded-none border border-zinc-800" 
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Background</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={bgColor} 
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-none border border-zinc-800 p-0 cursor-pointer"
                />
                <input 
                  type="text" 
                  value={bgColor.toUpperCase()} 
                  onChange={(e) => setBgColor(e.target.value)}
                  className={`flex-1 px-3 py-2 text-xs font-mono border border-zinc-800 rounded-none ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-gray-50 text-black'}`}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {palette.map((c, i) => (
                  <button 
                    key={i} 
                    onClick={() => setBgColor(c.hex)}
                    className="w-6 h-6 rounded-none border border-zinc-800" 
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {contrastInfo && (
            <div className={`p-6 border border-zinc-800 retro-shadow ${isDarkMode ? 'bg-zinc-900/50' : 'bg-gray-50'}`}>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contrast Ratio</div>
                  <div className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{contrastInfo.ratio}:1</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`flex items-center gap-2 text-xs font-bold ${contrastInfo.aaNormal ? 'text-green-500' : 'text-red-500'}`}>
                    {contrastInfo.aaNormal ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    WCAG AA
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-bold ${contrastInfo.aaaNormal ? 'text-green-500' : 'text-red-500'}`}>
                    {contrastInfo.aaaNormal ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    WCAG AAA
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-zinc-800 bg-white/5">
                    <div className="text-[9px] font-bold text-gray-500 uppercase mb-2">Normal Text</div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold ${contrastInfo.aaNormal ? 'text-green-500' : 'text-red-500'}`}>AA {contrastInfo.aaNormal ? 'PASS' : 'FAIL'}</span>
                      <span className={`text-[10px] font-bold ${contrastInfo.aaaNormal ? 'text-green-500' : 'text-red-500'}`}>AAA {contrastInfo.aaaNormal ? 'PASS' : 'FAIL'}</span>
                    </div>
                  </div>
                  <div className="p-3 border border-zinc-800 bg-white/5">
                    <div className="text-[9px] font-bold text-gray-500 uppercase mb-2">Large Text</div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold ${contrastInfo.aaLarge ? 'text-green-500' : 'text-red-500'}`}>AA {contrastInfo.aaLarge ? 'PASS' : 'FAIL'}</span>
                      <span className={`text-[10px] font-bold ${contrastInfo.aaaLarge ? 'text-green-500' : 'text-red-500'}`}>AAA {contrastInfo.aaaLarge ? 'PASS' : 'FAIL'}</span>
                    </div>
                  </div>
                </div>

                {!contrastInfo.aaNormal && (
                  <div className={`p-4 border border-dashed border-zinc-700 ${isDarkMode ? 'bg-zinc-800/30' : 'bg-zinc-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={14} className="text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Suggested Alternative</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-zinc-800" style={{ backgroundColor: contrastInfo.suggestedText }} />
                        <span className="font-mono text-xs font-bold">{contrastInfo.suggestedText.toUpperCase()}</span>
                      </div>
                      <button 
                        onClick={() => setTextColor(contrastInfo.suggestedText)}
                        className="text-[10px] font-bold uppercase tracking-widest bg-zinc-900 text-white px-3 py-1 hover:bg-black transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    <div className="mt-2 text-[9px] text-gray-500 italic">
                      This color provides a {contrastInfo.suggestedRatio}:1 ratio with the current background.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Simulation Section */}
        <div className="space-y-6 w-full pt-8 border-t border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-none bg-zinc-900 text-white flex items-center justify-center">
              <Eye size={16} />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest">Vision Simulation</h2>
          </div>

          <div className="relative">
            <div className="flex flex-wrap gap-2 mb-4">
              {(['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as ColorBlindnessType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSimulation(type)}
                  onMouseEnter={() => setHoveredType(type)}
                  onMouseLeave={() => setHoveredType(null)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    simulation === type 
                      ? 'bg-zinc-900 text-white border-zinc-900' 
                      : 'bg-transparent text-gray-500 border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {(hoveredType || simulation) && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 border border-zinc-800 text-[10px] leading-relaxed mb-6 ${isDarkMode ? 'bg-zinc-900 text-gray-400' : 'bg-gray-50 text-gray-600'}`}
                >
                  <span className="font-bold uppercase text-zinc-500 mr-2">{hoveredType || simulation}:</span>
                  {DISABILITY_INFO[hoveredType || simulation]}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Preview</div>
              <div 
                className="p-12 border border-zinc-800 retro-shadow transition-all duration-500 w-full"
                style={{ 
                  backgroundColor: bgColor, 
                  color: textColor,
                  filter: simulationFilters[simulation]
                }}
              >
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-4xl font-black uppercase tracking-tighter mb-6">Inclusive Design</h3>
                  <p className="text-lg leading-relaxed mb-8 max-w-2xl">
                    This preview demonstrates how your selected text and background colors appear to users with different types of color vision deficiencies. Good design is inclusive by default.
                  </p>
                  <div className="flex items-center gap-6">
                    <button className="px-8 py-3 text-sm font-bold uppercase tracking-widest border-2 border-current hover:bg-current hover:text-white transition-all">
                      Primary Action
                    </button>
                    <div className="flex -space-x-3">
                      {palette.map((c, i) => (
                        <div key={i} className="w-12 h-12 rounded-none border-2 border-current" style={{ backgroundColor: c.hex }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-zinc-800 bg-white/5" style={{ filter: simulationFilters[simulation] }}>
                <div className="text-[10px] font-bold text-gray-500 uppercase mb-4 tracking-widest">Palette Check</div>
                <div className="flex h-16 w-full">
                  {palette.map((c, i) => (
                    <div key={i} className="flex-1 h-full border-r border-black/10 last:border-0" style={{ backgroundColor: c.hex }} title={c.name} />
                  ))}
                </div>
              </div>
              <div className="p-6 border border-zinc-800 bg-white/5" style={{ filter: simulationFilters[simulation] }}>
                <div className="text-[10px] font-bold text-gray-500 uppercase mb-4 tracking-widest">UI Elements</div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-none border border-black/10" style={{ backgroundColor: palette[0]?.hex }} />
                  <div className="w-12 h-12 rounded-none border border-black/10" style={{ backgroundColor: palette[1]?.hex }} />
                  <div className="w-12 h-12 rounded-none border border-black/10" style={{ backgroundColor: palette[2]?.hex }} />
                  <div className="w-12 h-12 rounded-none border border-black/10" style={{ backgroundColor: palette[3]?.hex }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-800 flex items-start gap-4">
        <div className="p-2 bg-blue-500/10 text-blue-500">
          <Info size={20} />
        </div>
        <div className="space-y-1">
          <h4 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>About WCAG Standards</h4>
          <p className="text-[10px] text-gray-500 leading-relaxed max-w-2xl">
            WCAG 2.1 level AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text. 
            Level AAA requires a contrast ratio of at least 7:1 for normal text and 4.5:1 for large text. 
            Large text is defined as 14pt bold or 18pt regular and larger.
          </p>
        </div>
      </div>
    </div>
  );
};
