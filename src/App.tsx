/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Palette, 
  Settings2, 
  RefreshCw, 
  Copy, 
  Check, 
  Sparkles, 
  Info,
  X,
  ChevronDown,
  Sliders,
  Palette as PaletteIcon,
  Zap,
  Type,
  Layout,
  Eye,
  Monitor,
  Smartphone,
  CreditCard,
  Sun,
  Moon,
  Disc,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Color from 'color';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from "@google/genai";
import { 
  ColorTheoryRule, 
  PaletteColor, 
  AgentConfig, 
  DEFAULT_AGENTS 
} from './types';
import { generatePaletteFromRule, getColorName } from './colorUtils';
import { ColorWheelView } from './components/ColorWheelView';
import { AccessibilityView } from './components/AccessibilityView';
import { ColorSwatch } from './components/ColorSwatch';
import { ExportModal } from './components/ExportModal';
import { ImageColorPicker } from './components/ImageColorPicker';

const RULES: { id: ColorTheoryRule; name: string; description: string }[] = [
  { id: 'design-system', name: 'Design System', description: 'One Color → Full Design System. Generates 10 essential UI colors.' },
  { id: 'complementary', name: 'Complementary', description: 'Opposite colors on the wheel for high contrast.' },
  { id: 'analogous', name: 'Analogous', description: 'Adjacent colors for a harmonious, serene feel.' },
  { id: 'triadic', name: 'Triadic', description: 'Three evenly spaced colors for vibrant balance.' },
  { id: 'tetradic', name: 'Tetradic', description: 'Four colors in two complementary pairs.' },
  { id: 'monochromatic', name: 'Monochromatic', description: 'Variations in lightness and saturation of one hue.' },
  { id: 'split-complementary', name: 'Split Complementary', description: 'Base color plus two colors adjacent to its complement.' },
];

const LogoIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" className={className} style={{ minWidth: size, minHeight: size }}>
    <path d="M20 20 L20 0 A20 20 0 0 1 40 20 Z" fill="#FF5F5F" stroke="#000000" strokeWidth="1" />
    <path d="M20 20 L40 20 A20 20 0 0 1 20 40 Z" fill="#FFD95F" stroke="#000000" strokeWidth="1" />
    <path d="M20 20 L20 40 A20 20 0 0 1 0 20 Z" fill="#5FFF5F" stroke="#000000" strokeWidth="1" />
    <path d="M20 20 L0 20 A20 20 0 0 1 20 0 Z" fill="#5F5FFF" stroke="#000000" strokeWidth="1" />
    <circle cx="20" cy="20" r="4" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
  </svg>
);

export default function App() {
  const [baseColor, setBaseColor] = useState('#4f46e5');
  const [rule, setRule] = useState<ColorTheoryRule>('design-system');
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
  const [activeAgentId, setActiveAgentId] = useState(DEFAULT_AGENTS[0].id);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'palette' | 'preview' | 'wheel' | 'system' | 'image'>('system');
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize palette
  useEffect(() => {
    setPalette(prev => {
      const newPalette = generatePaletteFromRule(baseColor, rule, isDarkMode);
      
      // If switching to design-system, we want the full 10 colors regardless of locks
      if (rule === 'design-system') {
        return newPalette;
      }

      // For other rules, we want 5 colors and preserve locks if they exist
      if (prev.length > 0) {
        // Only take the first 5 colors from newPalette for standard rules
        const basePalette = newPalette.slice(0, 5);
        return basePalette.map((color, i) => {
          // If we had a locked color at this index, preserve it
          if (prev[i]?.isLocked) return prev[i];
          return color;
        });
      }
      
      return newPalette.slice(0, 5);
    });
  }, [baseColor, rule, isDarkMode]);

  const getColorByRole = (role: string) => {
    const color = palette.find(c => c.role === role);
    return color ? color.hex : (palette[0]?.hex || '#000000');
  };

  const handleCopy = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const updateColor = useCallback((index: number, updates: Partial<PaletteColor>) => {
    setPalette(prev => prev.map((c, i) => {
      if (i === index) {
        const newColor = { ...c, ...updates };
        if (updates.hex) {
          newColor.name = getColorName(updates.hex);
        }
        return newColor;
      }
      return c;
    }));
  }, []);

  const handleBaseColorChange = useCallback((hex: string) => {
    setBaseColor(hex);
  }, []);

  const generateShades = (hex: string) => {
    const base = Color(hex);
    const shades: PaletteColor[] = [
      { hex: base.lighten(0.4).hex(), name: getColorName(base.lighten(0.4).hex()), role: 'Highlight' },
      { hex: base.lighten(0.2).hex(), name: getColorName(base.lighten(0.2).hex()), role: 'Surface' },
      { hex: base.hex(), name: getColorName(base.hex()), role: 'Primary' },
      { hex: base.darken(0.2).hex(), name: getColorName(base.darken(0.2).hex()), role: 'Secondary' },
      { hex: base.darken(0.4).hex(), name: getColorName(base.darken(0.4).hex()), role: 'Background' },
    ];
    setPalette(shades);
    setBaseColor(hex);
  };

  const handleRandomize = () => {
    const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setBaseColor(randomHex);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: [randomHex]
    });
  };

  const generateAIPalette = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const agent = agents.find(a => a.id === activeAgentId) || agents[0];
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: agent.model,
        contents: `Mood/Keyword: ${prompt}${activeAgentId === 'brand-expert' ? ' (Reference: https://brandingstyleguides.com/)' : ''}`,
        config: {
          systemInstruction: agent.systemInstruction,
          temperature: agent.temperature,
          topP: agent.topP,
          topK: agent.topK,
          responseMimeType: "application/json",
          tools: activeAgentId === 'brand-expert' ? [{ urlContext: {} }] : undefined,
        }
      });

      const text = response.text;
      if (text) {
        const hexCodes: string[] = JSON.parse(text);
        if (Array.isArray(hexCodes)) {
          setPalette(prev => {
            let aiIndex = 0;
            return prev.map((color, i) => {
              if (color.isLocked) return color;
              const hex = hexCodes[aiIndex] || hexCodes[0];
              aiIndex++;
              return { 
                hex, 
                name: getColorName(hex),
                role: color.role
              };
            });
          });
          if (hexCodes[0]) setBaseColor(hexCodes[0]);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        setGenerationError("The AI is taking a breather (Quota Exceeded). Please wait a minute and try again.");
      } else {
        setGenerationError("Something went wrong with the AI. Please try a different prompt.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const updateAgent = (id: string, updates: Partial<AgentConfig>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0a0a] text-[#f5f5f5] dark' : 'bg-[#F9FAFB] text-[#111827]'} font-mono selection:bg-zinc-200`}>
      {/* Header */}
      <header className={`border-b border-zinc-800 ${isDarkMode ? 'bg-[#111111]' : 'bg-white'} px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10`}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase leading-none flex items-center gap-0.5 font-display">
              SMORGASB<LogoIcon size={28} className="inline-block align-middle mb-1" />ARD
            </h1>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium uppercase tracking-wider`}>semi-pro palette picker</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Retro Theme Slider */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Sun size={12} className={`sm:w-[14px] sm:h-[14px] ${isDarkMode ? 'text-gray-600' : 'text-zinc-900'}`} />
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative w-10 h-5 sm:w-12 sm:h-6 border-2 border-zinc-800 transition-colors ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}
            >
              <div className={`absolute top-0.5 bottom-0.5 w-3 sm:w-4 bg-zinc-900 border border-zinc-700 transition-all duration-300 ${isDarkMode ? 'left-[22px] sm:left-[26px]' : 'left-0.5'}`} />
            </button>
            <Moon size={12} className={`sm:w-[14px] sm:h-[14px] ${isDarkMode ? 'text-zinc-100' : 'text-gray-400'}`} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch`}>
        {/* AI Assistant Section */}
        <section className={`lg:col-span-12 ${isDarkMode ? 'bg-[#111111]' : 'bg-white'} p-3 sm:p-4 rounded-none border border-zinc-800 retro-shadow space-y-3`}>
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
              <div className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 ${isDarkMode ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900'} rounded-none flex items-center justify-center shadow-none`}>
                <Sparkles size={16} />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm sm:text-lg font-bold tracking-tight truncate">AI Assistant</h2>
                <p className={`hidden sm:block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Describe your vision</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 sm:gap-2 ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'} p-1 sm:p-1.5 rounded-none border border-zinc-800 shrink-0`}>
              <span className="hidden xs:inline text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 sm:pl-2">Agent:</span>
              <select 
                value={activeAgentId}
                onChange={(e) => setActiveAgentId(e.target.value)}
                className={`${isDarkMode ? 'bg-[#222222] text-white' : 'bg-white text-zinc-900'} border border-zinc-800 text-[10px] sm:text-xs font-bold rounded-none px-1.5 sm:px-3 py-1 sm:py-1.5 outline-none cursor-pointer hover:border-zinc-600 transition-colors min-w-[120px] sm:min-w-[160px]`}
              >
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button 
                onClick={() => setIsAgentModalOpen(true)}
                className={`flex items-center gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-none border border-zinc-800 ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100' : 'bg-white hover:bg-gray-100 text-zinc-900'} transition-colors text-[9px] sm:text-[10px] font-bold uppercase tracking-wider`}
              >
                <Settings2 size={10} />
                <span className="hidden xs:inline">Settings</span>
                <span className="xs:hidden">Set</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="flex-1 relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A minimalist organic skincare brand' or 'Vibrant 80s synthwave aesthetic'..."
                className={`w-full ${isDarkMode ? 'bg-[#1a1a1a] text-white focus:bg-[#222222]' : 'bg-gray-50 text-zinc-900 focus:bg-white'} border border-zinc-800 rounded-none p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none min-h-[80px] h-full resize-none transition-all`}
              />
              {generationError && (
                <div className="absolute -bottom-6 left-0 right-0 text-[10px] font-bold text-red-500 uppercase tracking-wider animate-pulse">
                  {generationError}
                </div>
              )}
            </div>
            <button
              onClick={generateAIPalette}
              disabled={isGenerating || !prompt.trim()}
              className={`md:w-48 ${isDarkMode ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-black'} px-8 py-3 rounded-none font-bold transition-all disabled:opacity-50 retro-shadow flex items-center justify-center gap-3 group`}
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="flex items-center justify-center"
                >
                  <LogoIcon size={20} />
                </motion.div>
              ) : (
                <Zap size={20} className="group-hover:scale-110 transition-transform" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
            </button>
          </div>
        </section>

        {/* Palette Display */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="space-y-3 flex-none">
            <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between ${isDarkMode ? 'bg-[#111111]' : 'bg-white'} p-2 rounded-none border border-zinc-800 retro-shadow gap-3`}>
              <div className="grid grid-cols-2 sm:flex gap-1 w-full sm:w-auto">
                <button 
                  onClick={() => setViewMode('palette')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-none text-sm font-bold transition-all ${
                    viewMode === 'palette' 
                      ? (isDarkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white') 
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Palette size={16} />
                  Palette
                </button>
                <button 
                  onClick={() => setViewMode('wheel')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-none text-sm font-bold transition-all ${
                    viewMode === 'wheel' 
                      ? (isDarkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white') 
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Disc size={16} />
                  Wheel
                </button>
                <button 
                  onClick={() => setViewMode('preview')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-none text-sm font-bold transition-all ${
                    viewMode === 'preview' 
                      ? (isDarkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white') 
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Eye size={16} />
                  Preview
                </button>
                <button 
                  onClick={() => setViewMode('system')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-none text-sm font-bold transition-all ${
                    viewMode === 'system' 
                      ? (isDarkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white') 
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Settings size={16} />
                  System
                </button>
                <button 
                  onClick={() => setViewMode('image')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-none text-sm font-bold transition-all ${
                    viewMode === 'image' 
                      ? (isDarkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white') 
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Upload size={16} />
                  Image
                </button>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(true)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-none text-sm font-bold transition-all border border-zinc-800 ${
                  isDarkMode 
                    ? 'bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' 
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                } active:bg-zinc-900 active:text-white dark:active:bg-zinc-100 dark:active:text-zinc-900`}
              >
                <Download size={16} />
                Export
              </button>
            </div>

            <div className={`${isDarkMode ? 'bg-[#111111]' : 'bg-white'} px-5 py-3 rounded-none border border-zinc-800 retro-shadow flex items-center gap-3`}>
              <div 
                className="w-3 h-3 rounded-none animate-pulse shadow-none" 
                style={{ backgroundColor: baseColor }}
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Active Theory Mode</span>
                <span className={`text-xs sm:text-sm font-black ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'} uppercase tracking-[0.15em] leading-none`}>
                  {rule.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {viewMode === 'palette' ? (
                <motion.div 
                  key="palette-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`grid grid-cols-5 ${rule === 'design-system' ? 'grid-rows-2 gap-y-8 sm:gap-y-12' : ''} gap-x-2 sm:gap-x-4 gap-y-4 flex-1 w-full`}
                >
                  {palette.map((color, i) => (
                    <ColorSwatch
                      key={`${i}-${color.hex}`}
                      color={color}
                      index={i}
                      isDarkMode={isDarkMode}
                      onUpdate={updateColor}
                      onCopy={handleCopy}
                      isCopied={copiedIndex === i}
                      onGenerateShades={generateShades}
                    />
                  ))}
                </motion.div>
              ) : viewMode === 'preview' ? (
                <motion.div
                  key="mockup-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1"
                >
                  {/* ... Landing Page Mockup ... */}
                  <div className={`${isDarkMode ? 'bg-[#111111]' : 'bg-white'} rounded-none border border-zinc-800 retro-shadow overflow-hidden flex flex-col`}>
                    <div className={`p-4 border-b border-zinc-800 flex items-center gap-2 ${isDarkMode ? 'bg-zinc-900/50' : 'bg-gray-50/50'}`}>
                      <Monitor size={14} className="text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Landing Page Hero</span>
                    </div>
                    <div className="p-8 space-y-6 flex-1 flex flex-col justify-center" style={{ backgroundColor: getColorByRole('Primary') + '10' }}>
                      <div className="space-y-2">
                        <div className="h-2 w-20 rounded-none" style={{ backgroundColor: getColorByRole('Secondary') }} />
                        <h4 className={`text-3xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} style={{ color: getColorByRole('Primary') }}>
                          Design your future <br /> with ChromaTheory.
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-xs`}>
                          The ultimate tool for designers to create, manage, and deploy beautiful color systems.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button className="px-6 py-2.5 rounded-none text-sm font-bold shadow-none" style={{ backgroundColor: getColorByRole('Primary'), color: '#fff' }}>
                          Get Started
                        </button>
                        <button className={`px-6 py-2.5 rounded-none text-sm font-bold border ${isDarkMode ? 'border-zinc-700' : 'border-zinc-800'}`} style={{ borderColor: getColorByRole('Accent'), color: getColorByRole('Accent') }}>
                          Learn More
                        </button>
                      </div>
                      <div className="pt-4 flex gap-4">
                        {['Secondary', 'Accent', 'Surface'].map(role => (
                          <div key={role} className="w-10 h-10 rounded-none border border-zinc-800" style={{ backgroundColor: getColorByRole(role) }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mobile App Mockup */}
                  <div className={`${isDarkMode ? 'bg-[#111111]' : 'bg-white'} rounded-none border border-zinc-800 retro-shadow overflow-hidden flex flex-col`}>
                    <div className={`p-4 border-b border-zinc-800 flex items-center gap-2 ${isDarkMode ? 'bg-zinc-900/50' : 'bg-gray-50/50'}`}>
                      <Smartphone size={14} className="text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Dashboard</span>
                    </div>
                    <div className={`p-6 space-y-6 flex-1 ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-none ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'} border border-zinc-800`} />
                        <div className={`w-8 h-8 rounded-none ${isDarkMode ? 'bg-[#111111]' : 'bg-white'} shadow-none border border-zinc-800 flex items-center justify-center`}>
                          <RefreshCw size={14} style={{ color: getColorByRole('Primary') }} />
                        </div>
                      </div>
                      <div className={`${isDarkMode ? 'bg-[#111111]' : 'bg-white'} p-6 rounded-none shadow-none space-y-4 border border-zinc-800`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400 uppercase">Total Balance</span>
                          <CreditCard size={16} style={{ color: getColorByRole('Secondary') }} />
                        </div>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} style={{ color: getColorByRole('Primary') }}>$12,450.00</div>
                        <div className="flex gap-1">
                          {['Primary', 'Secondary', 'Accent', 'Surface', 'Background'].map(role => (
                            <div key={role} className="h-1 flex-1 rounded-none" style={{ backgroundColor: getColorByRole(role) }} />
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-none text-white shadow-none border border-zinc-800" style={{ backgroundColor: getColorByRole('Accent') }}>
                          <div className="text-[10px] font-bold opacity-80 uppercase">Savings</div>
                          <div className="text-lg font-bold">$2,400</div>
                        </div>
                        <div className="p-4 rounded-none text-white shadow-none border border-zinc-800" style={{ backgroundColor: getColorByRole('Surface') }}>
                          <div className="text-[10px] font-bold opacity-80 uppercase">Invested</div>
                          <div className="text-lg font-bold">$8,100</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Mockup */}
                  <div className={`${isDarkMode ? 'bg-[#111111]' : 'bg-white'} rounded-none border border-zinc-800 retro-shadow overflow-hidden flex flex-col md:col-span-2`}>
                    <div className={`p-4 border-b border-zinc-800 flex items-center gap-2 ${isDarkMode ? 'bg-zinc-900/50' : 'bg-gray-50/50'}`}>
                      <Layout size={14} className="text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Component Preview</span>
                    </div>
                    <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className={`p-5 border border-zinc-800 ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-50'} flex flex-col h-full`}>
                        <div className="aspect-video rounded-none shadow-none border border-zinc-800 mb-4" style={{ backgroundColor: getColorByRole('Secondary') }} />
                        <div className="space-y-2 mb-6 flex-1">
                          <div className="h-4 w-3/4 rounded-none" style={{ backgroundColor: getColorByRole('Primary') + '20' }} />
                          <div className={`h-2.5 w-full rounded-none ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`} />
                          <div className={`h-2.5 w-1/2 rounded-none ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`} />
                        </div>
                        <button className="w-full py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest text-white shadow-none border border-zinc-800" style={{ backgroundColor: getColorByRole('Primary') }}>
                          Action
                        </button>
                      </div>

                      <div className={`${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-50'} p-5 border border-zinc-800 flex flex-col items-center text-center h-full`}>
                        <div className="w-12 h-12 rounded-none flex items-center justify-center border border-zinc-800 mb-4 mt-2" style={{ backgroundColor: getColorByRole('Background') + '20' }}>
                          <Sparkles size={24} style={{ color: getColorByRole('Background') }} />
                        </div>
                        <div className="space-y-1 mb-6 flex-1">
                          <h5 className={`text-xs font-bold uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} style={{ color: getColorByRole('Primary') }}>Premium Access</h5>
                          <p className="text-[10px] text-gray-500 leading-tight">Get exclusive color sets and advanced tools.</p>
                        </div>
                        <button className="w-full py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest text-white shadow-none border border-zinc-800" style={{ backgroundColor: getColorByRole('Secondary') }}>
                          Upgrade Now
                        </button>
                      </div>

                      <div className={`p-5 border border-zinc-800 ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-50'} flex flex-col h-full space-y-4`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Project Status</span>
                          <div className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-tighter text-white" style={{ backgroundColor: getColorByRole('Accent') }}>Active</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[9px] text-gray-500 uppercase font-medium">Progress</span>
                            <span className={`text-[10px] font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>74%</span>
                          </div>
                          <div className={`h-1.5 w-full rounded-none ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'} overflow-hidden`}>
                            <div className="h-full" style={{ width: '74%', backgroundColor: getColorByRole('Primary') }} />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <div className="px-2 py-1 text-[8px] font-bold border border-zinc-800" style={{ color: getColorByRole('Primary'), backgroundColor: getColorByRole('Primary') + '10' }}>DESIGN</div>
                          <div className="px-2 py-1 text-[8px] font-bold border border-zinc-800" style={{ color: getColorByRole('Secondary'), backgroundColor: getColorByRole('Secondary') + '10' }}>SYSTEM</div>
                          <div className="px-2 py-1 text-[8px] font-bold border border-zinc-800" style={{ color: getColorByRole('Accent'), backgroundColor: getColorByRole('Accent') + '10' }}>UI/UX</div>
                        </div>

                        <div className="flex-1" />
                        
                        <div className="pt-4 border-t border-zinc-800/50 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-none border border-zinc-800 shrink-0" style={{ backgroundColor: getColorByRole('Surface') }} />
                          <div className="flex-1 space-y-1">
                            <div className="h-1.5 w-1/2 rounded-none" style={{ backgroundColor: getColorByRole('Primary') + '40' }} />
                            <div className={`h-1 w-full rounded-none ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : viewMode === 'wheel' ? (
                <motion.div
                  key="wheel-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1"
                >
                  <ColorWheelView 
                    palette={palette} 
                    isDarkMode={isDarkMode} 
                    onUpdate={updateColor}
                    onBaseColorChange={handleBaseColorChange}
                  />
                </motion.div>
              ) : viewMode === 'system' ? (
                <motion.div
                  key="accessibility-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1"
                >
                  <AccessibilityView palette={palette} isDarkMode={isDarkMode} />
                </motion.div>
              ) : viewMode === 'image' ? (
                <motion.div
                  key="image-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1"
                >
                  <ImageColorPicker 
                    isDarkMode={isDarkMode} 
                    onColorsExtracted={(colors) => {
                      setBaseColor(colors[0]);
                      // Optionally update the whole palette if needed
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </section>

        {/* Sidebar Controls */}
        <aside className="lg:col-span-4 flex flex-col">
          <section className={`${isDarkMode ? 'bg-[#111111]' : 'bg-white'} p-6 rounded-none border border-zinc-800 retro-shadow space-y-6 h-full flex flex-col`}>
            <div className="space-y-2 flex-none">
              <label className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} uppercase tracking-widest flex items-center gap-2`}>
                <Zap size={14} className={isDarkMode ? 'text-zinc-100' : 'text-zinc-900'} />
                Base Color
              </label>
              <div className="flex gap-2">
                <div className="relative w-12 h-12 shrink-0 border border-zinc-800 overflow-hidden">
                  <input 
                    type="color" 
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] cursor-pointer"
                  />
                </div>
                <input 
                  type="text" 
                  value={baseColor.toUpperCase()}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className={`w-32 px-3 rounded-none border border-zinc-800 font-mono text-base focus:ring-2 focus:ring-zinc-900 outline-none ${isDarkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-zinc-900'}`}
                />
              </div>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex-none">Theory Rule</label>
              <div className={`grid ${viewMode === 'palette' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 flex-1 content-start`}>
                {RULES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRule(r.id)}
                    className={`text-left p-3 rounded-none border transition-all flex flex-col justify-center min-h-[80px] ${
                      rule === r.id 
                        ? (isDarkMode ? 'border-zinc-100 bg-[#222222] ring-1 ring-zinc-100' : 'border-zinc-900 bg-zinc-100 ring-1 ring-zinc-900') 
                        : (isDarkMode ? 'border-zinc-800 hover:border-zinc-600 bg-[#1a1a1a]' : 'border-zinc-800 hover:border-zinc-600 bg-gray-50/30')
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {rule === r.id && (
                        <div 
                          className="w-2 h-2 rounded-none shrink-0" 
                          style={{ backgroundColor: baseColor }}
                        />
                      )}
                      <div className={`text-[11px] sm:text-base leading-tight transition-all ${
                        rule === r.id 
                          ? (isDarkMode ? 'font-black text-zinc-100' : 'font-black text-zinc-900') 
                          : (isDarkMode ? 'font-semibold text-gray-400' : 'font-semibold text-gray-700')
                      }`}>{r.name}</div>
                    </div>
                    <div className={`text-[9px] sm:text-[10px] mt-1 leading-tight line-clamp-2 transition-colors ${
                      rule === r.id 
                        ? (isDarkMode ? 'text-zinc-400 font-medium' : 'text-zinc-600 font-medium') 
                        : 'text-gray-500'
                    }`}>{r.description}</div>
                  </button>
                ))}

                {/* Randomize Button as a Grid Item */}
                <button
                  onClick={handleRandomize}
                  className={`text-left p-3 rounded-none border transition-all flex flex-col justify-center min-h-[80px] group ${
                    isDarkMode 
                      ? 'border-zinc-800 hover:border-zinc-100 bg-[#1a1a1a] hover:bg-[#222222]' 
                      : 'border-zinc-800 hover:border-zinc-900 bg-gray-50/30 hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className="shrink-0 group-hover:rotate-180 transition-transform duration-500" />
                    <div className={`text-[11px] sm:text-base font-bold leading-tight uppercase tracking-wider ${
                      isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                    }`}>Randomize</div>
                  </div>
                  <div className="text-[9px] sm:text-[10px] mt-1 leading-tight text-gray-500">
                    Generate a completely random base color and rule.
                  </div>
                </button>
              </div>
            </div>
          </section>
        </aside>
      </main>

      {/* Agent Settings Modal */}
      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        palette={palette} 
        isDarkMode={isDarkMode} 
      />

      <AnimatePresence>
        {isAgentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAgentModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-4xl ${isDarkMode ? 'bg-[#111111]' : 'bg-white'} rounded-none retro-shadow border border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]`}
            >
              <div className={`p-6 border-b border-zinc-800 flex items-center justify-between ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50/50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'} rounded-none border border-zinc-800 flex items-center justify-center`}>
                    <Settings2 size={20} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Agent Configuration</h2>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customize AI behavior and model parameters</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAgentModalOpen(false)}
                  className={`p-2 ${isDarkMode ? 'hover:bg-zinc-800 text-white' : 'hover:bg-gray-200 text-zinc-900'} rounded-none transition-colors`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {agents.map((agent) => (
                  <div key={agent.id} className={`space-y-6 p-6 rounded-none border border-zinc-800 ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50/30'}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{agent.name}</h3>
                      <span className={`px-2 py-1 ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'} text-[10px] font-bold rounded-none border border-zinc-800 uppercase tracking-wider`}>
                        {agent.model}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Instructions</label>
                        <textarea 
                          value={agent.systemInstruction}
                          onChange={(e) => updateAgent(agent.id, { systemInstruction: e.target.value })}
                          className={`w-full text-sm p-3 rounded-none border border-zinc-800 focus:ring-2 focus:ring-zinc-900 outline-none min-h-[120px] ${isDarkMode ? 'bg-[#222222] text-white' : 'bg-white text-zinc-900'}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Model</label>
                          <select 
                            value={agent.model}
                            onChange={(e) => updateAgent(agent.id, { model: e.target.value })}
                            className={`w-full text-sm p-2 rounded-none border border-zinc-800 ${isDarkMode ? 'bg-[#222222] text-white' : 'bg-white text-zinc-900'}`}
                          >
                            <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                            <option value="gemini-3.1-flash-lite-preview">Gemini Flash Lite</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Temperature ({agent.temperature})</label>
                          <input 
                            type="range" min="0" max="1" step="0.1"
                            value={agent.temperature}
                            onChange={(e) => updateAgent(agent.id, { temperature: parseFloat(e.target.value) })}
                            className="w-full accent-zinc-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top P ({agent.topP})</label>
                          <input 
                            type="range" min="0" max="1" step="0.05"
                            value={agent.topP}
                            onChange={(e) => updateAgent(agent.id, { topP: parseFloat(e.target.value) })}
                            className="w-full accent-zinc-900"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top K ({agent.topK})</label>
                          <input 
                            type="number"
                            value={agent.topK}
                            onChange={(e) => updateAgent(agent.id, { topK: parseInt(e.target.value) })}
                            className={`w-full text-sm p-2 rounded-none border border-zinc-800 ${isDarkMode ? 'bg-[#222222] text-white' : 'bg-white text-zinc-900'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-6 border-t border-zinc-800 ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50/50'} flex justify-end`}>
                <button 
                  onClick={() => setIsAgentModalOpen(false)}
                  className={`${isDarkMode ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-black'} px-8 py-3 rounded-none font-bold transition-all retro-shadow border border-zinc-800`}
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`max-w-7xl mx-auto px-8 py-12 border-t border-zinc-800 mt-12 flex flex-col md:flex-row items-center justify-between gap-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        <div className="flex items-center gap-2 text-sm">
          <Info size={16} />
          <span>Colors generated using standard color theory algorithms and Gemini AI.</span>
        </div>
        <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
          <a href="#" className={`hover:${isDarkMode ? 'text-white' : 'text-zinc-900'} transition-colors`}>Documentation</a>
          <a href="#" className={`hover:${isDarkMode ? 'text-white' : 'text-zinc-900'} transition-colors`}>API Access</a>
          <a href="#" className={`hover:${isDarkMode ? 'text-white' : 'text-zinc-900'} transition-colors`}>Privacy</a>
        </div>
      </footer>
    </div>
  );
}
