import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Pipette, 
  Check, 
  Copy,
  AlertCircle,
  X
} from 'lucide-react';
import Color from 'color';

interface ImageColorPickerProps {
  isDarkMode: boolean;
  onColorsExtracted: (colors: string[]) => void;
}

export const ImageColorPicker: React.FC<ImageColorPickerProps> = ({ isDarkMode, onColorsExtracted }) => {
  const [image, setImage] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const extractColors = () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorCounts: Record<string, number> = {};

    // Sample pixels (every 10th pixel for performance)
    for (let i = 0; i < imageData.length; i += 40) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const hex = Color.rgb(r, g, b).hex();
      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }

    // Sort by frequency and take top 10
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hex]) => hex);

    setExtractedColors(sortedColors);
    if (sortedColors.length > 0) {
      onColorsExtracted(sortedColors);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current || !canvasRef.current) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * img.naturalWidth;
    const y = ((e.clientY - rect.top) / rect.height) * img.naturalHeight;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = Color.rgb(pixel[0], pixel[1], pixel[2]).hex();
    setSelectedColor(hex);
    onColorsExtracted([hex]);
  };

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = extractColors;
    }
  }, [image]);

  const reset = () => {
    setImage(null);
    setExtractedColors([]);
    setSelectedColor(null);
    setError(null);
  };

  return (
    <div className={`flex flex-col gap-8 p-6 rounded-none border border-zinc-800 retro-shadow ${isDarkMode ? 'bg-[#111111]' : 'bg-white'} min-h-[600px]`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-none ${isDarkMode ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-900 text-white'} flex items-center justify-center`}>
            <Pipette size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-widest">Image to Palette</h2>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>Extract colors from any image</p>
          </div>
        </div>

        {image && (
          <button
            onClick={reset}
            className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-bold uppercase tracking-widest transition-all border border-zinc-800 ${
              isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-zinc-900 hover:bg-gray-200'
            }`}
          >
            <X size={14} />
            Reset
          </button>
        )}
      </div>

      {!image ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed transition-all ${
            isDragging 
              ? 'border-zinc-900 bg-zinc-50 dark:bg-zinc-800/20' 
              : 'border-zinc-300 dark:border-zinc-800'
          } min-h-[400px] p-12 text-center relative`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-none ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
              <Upload size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold uppercase tracking-wider">Drop your image here</p>
              <p className="text-xs text-gray-400">or click to browse files</p>
            </div>
            {error && (
              <div className="flex items-center justify-center gap-2 text-red-500 text-xs font-bold uppercase">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          <div className="lg:col-span-8 space-y-4">
            <div className="relative group cursor-crosshair border border-zinc-800 retro-shadow overflow-hidden bg-zinc-100 dark:bg-zinc-900">
              <img
                ref={imageRef}
                src={image}
                alt="Uploaded"
                className="w-full h-auto max-h-[600px] object-contain"
                onClick={handleImageClick}
                referrerPolicy="no-referrer"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Click anywhere to pick a color
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Dominant Colors</h3>
              <div className="grid grid-cols-2 gap-3">
                {extractedColors.map((hex, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedColor(hex);
                      onColorsExtracted([hex]);
                    }}
                    className={`group relative flex flex-col border border-zinc-800 transition-all hover:scale-105 ${
                      selectedColor === hex ? 'ring-2 ring-zinc-900 dark:ring-white' : ''
                    }`}
                  >
                    <div className="h-12 w-full" style={{ backgroundColor: hex }} />
                    <div className={`p-2 text-[10px] font-mono font-bold uppercase ${isDarkMode ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}`}>
                      {hex}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedColor && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 border border-zinc-800 retro-shadow ${isDarkMode ? 'bg-zinc-900' : 'bg-gray-50'} space-y-4`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest">Selected Color</h3>
                  <div className="w-6 h-6 border border-zinc-800" style={{ backgroundColor: selectedColor }} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xl font-mono font-black uppercase tracking-tight">{selectedColor}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedColor)}
                    className={`p-2 rounded-none border border-zinc-800 ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-white'} transition-colors`}
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <div className="pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase">
                    <Check size={14} />
                    Applied as base color
                  </div>
                </div>
              </motion.div>
            )}

            <div className={`p-4 border-l-4 border-zinc-800 ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'} text-[10px] italic`}>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Tip: Upload an image to automatically extract its most prominent colors, or click directly on the image to pick a specific hue.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
