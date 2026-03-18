import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Download, Code, FileJson, Figma, Box } from 'lucide-react';
import { PaletteColor } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  palette: PaletteColor[];
  isDarkMode: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, palette, isDarkMode }) => {
  const [copiedFormat, setCopiedFormat] = React.useState<string | null>(null);

  const generateTailwind = () => {
    const config: Record<string, string> = {};
    palette.forEach(c => {
      const key = (c.role || c.name).toLowerCase().replace(/\s+/g, '-');
      config[key] = c.hex;
    });
    return JSON.stringify({ theme: { extend: { colors: config } } }, null, 2);
  };

  const generateCSS = () => {
    let css = ':root {\n';
    palette.forEach(c => {
      const key = (c.role || c.name).toLowerCase().replace(/\s+/g, '-');
      css += `  --color-${key}: ${c.hex};\n`;
    });
    css += '}';
    return css;
  };

  const generateFigma = () => {
    const tokens: Record<string, any> = {};
    palette.forEach(c => {
      const key = (c.role || c.name).toLowerCase().replace(/\s+/g, '-');
      tokens[key] = {
        value: c.hex,
        type: 'color'
      };
    });
    return JSON.stringify(tokens, null, 2);
  };

  const generateMaterial = () => {
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n';
    palette.forEach(c => {
      const key = (c.role || c.name).toLowerCase().replace(/\s+/g, '_');
      xml += `  <color name="${key}">${c.hex}</color>\n`;
    });
    xml += '</resources>';
    return xml;
  };

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const formats = [
    { id: 'tailwind', name: 'Tailwind Config', icon: <Code size={18} />, content: generateTailwind() },
    { id: 'css', name: 'CSS Variables', icon: <Box size={18} />, content: generateCSS() },
    { id: 'figma', name: 'Figma Tokens', icon: <Figma size={18} />, content: generateFigma() },
    { id: 'material', name: 'Material Theme', icon: <FileJson size={18} />, content: generateMaterial() },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                  <Download size={20} />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Export Design System</h2>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Export your palette in various production-ready formats</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className={`p-2 ${isDarkMode ? 'hover:bg-zinc-800 text-white' : 'hover:bg-gray-200 text-zinc-900'} rounded-none transition-colors`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {formats.map((f) => (
                <div key={f.id} className={`space-y-3 p-6 rounded-none border border-zinc-800 ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50/30'} flex flex-col`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>{f.icon}</span>
                      <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{f.name}</h3>
                    </div>
                    <button 
                      onClick={() => handleCopy(f.content, f.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-none border border-zinc-800 text-[10px] font-bold uppercase tracking-wider transition-all ${
                        copiedFormat === f.id 
                          ? 'bg-green-500 text-white border-green-600' 
                          : (isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-zinc-900 hover:bg-gray-50')
                      }`}
                    >
                      {copiedFormat === f.id ? <Check size={12} /> : <Copy size={12} />}
                      {copiedFormat === f.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className={`flex-1 p-4 rounded-none border border-zinc-800 font-mono text-[10px] overflow-auto max-h-[200px] ${isDarkMode ? 'bg-[#0a0a0a] text-zinc-400' : 'bg-white text-zinc-600'}`}>
                    {f.content}
                  </pre>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
