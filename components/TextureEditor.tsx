import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Sparkles, Download, Eraser, PaintBucket, PenTool, ZoomIn, ZoomOut, Undo, RefreshCcw, Pipette, WifiOff } from 'lucide-react';
import { editTextureWithAi } from '../services/geminiService';

const RESOLUTIONS = [16, 32, 64];
const PALETTE = ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'];

type Tool = 'pencil' | 'eraser' | 'bucket' | 'picker';

const TextureEditor: React.FC = () => {
  const [resolution, setResolution] = useState(16);
  const [pixels, setPixels] = useState<string[]>(Array(16 * 16).fill('transparent'));
  const [history, setHistory] = useState<string[][]>([Array(16 * 16).fill('transparent')]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [selectedColor, setSelectedColor] = useState('#ff004d');
  const [tool, setTool] = useState<Tool>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Zoom state
  const [zoom, setZoom] = useState(32);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
        window.removeEventListener('online', handleStatus);
        window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // Initialize pixels when resolution changes
  useEffect(() => {
    const newPixels = Array(resolution * resolution).fill('transparent');
    setPixels(newPixels);
    setHistory([newPixels]);
    setHistoryIndex(0);
    
    // Set default zoom to fit roughly 512px
    setZoom(Math.floor(512 / resolution));
  }, [resolution]);

  // Draw pixels to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear
    ctx.clearRect(0, 0, resolution, resolution);
    
    // Draw Pixels
    pixels.forEach((color, i) => {
        if (color !== 'transparent') {
            const x = i % resolution;
            const y = Math.floor(i / resolution);
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        }
    });

  }, [pixels, resolution]);

  const saveToHistory = (newPixels: string[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newPixels);
      // Limit history
      if (newHistory.length > 20) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setPixels(newPixels);
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setPixels(history[newIndex]);
      }
  };

  const getPixelIndex = (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return -1;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      
      if (x < 0 || x >= resolution || y < 0 || y >= resolution) return -1;
      return y * resolution + x;
  };

  const floodFill = (startIndex: number, targetColor: string, replacementColor: string, currentPixels: string[]) => {
      if (targetColor === replacementColor) return currentPixels;
      const newPixels = [...currentPixels];
      const queue = [startIndex];
      const visited = new Set([startIndex]);

      while (queue.length > 0) {
          const idx = queue.pop()!;
          newPixels[idx] = replacementColor;
          
          const x = idx % resolution;
          const y = Math.floor(idx / resolution);
          
          const neighbors = [
              { nx: x + 1, ny: y },
              { nx: x - 1, ny: y },
              { nx: x, ny: y + 1 },
              { nx: x, ny: y - 1 }
          ];

          for (const {nx, ny} of neighbors) {
              if (nx >= 0 && nx < resolution && ny >= 0 && ny < resolution) {
                  const nIdx = ny * resolution + nx;
                  if (!visited.has(nIdx) && newPixels[nIdx] === targetColor) {
                      visited.add(nIdx);
                      queue.push(nIdx);
                  }
              }
          }
      }
      return newPixels;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
      const idx = getPixelIndex(e);
      if (idx === -1) return;
      
      if (tool === 'bucket') {
          const targetColor = pixels[idx];
          const newPixels = floodFill(idx, targetColor, selectedColor, pixels);
          saveToHistory(newPixels);
      } else if (tool === 'picker') {
          if (pixels[idx] !== 'transparent') {
              setSelectedColor(pixels[idx]);
              setTool('pencil');
          }
      } else {
          // Pencil or Eraser start
          setIsDrawing(true);
          paint(idx);
      }
  };

  const paint = (idx: number) => {
      const newColor = tool === 'eraser' ? 'transparent' : selectedColor;
      if (pixels[idx] !== newColor) {
          const newPixels = [...pixels];
          newPixels[idx] = newColor;
          setPixels(newPixels);
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDrawing) return;
      const idx = getPixelIndex(e);
      if (idx !== -1) paint(idx);
  };

  const handleMouseUp = () => {
      if (isDrawing) {
          setIsDrawing(false);
          saveToHistory(pixels);
      }
  };

  const handleDownload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `texture_${resolution}x${resolution}.png`;
      link.href = canvas.toDataURL();
      link.click();
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                  // Draw image to temp canvas to extract pixels
                  const tempCanvas = document.createElement('canvas');
                  tempCanvas.width = resolution;
                  tempCanvas.height = resolution;
                  const ctx = tempCanvas.getContext('2d');
                  if (ctx) {
                      ctx.drawImage(img, 0, 0, resolution, resolution);
                      const imageData = ctx.getImageData(0, 0, resolution, resolution);
                      const newPixels = [];
                      for (let i = 0; i < imageData.data.length; i += 4) {
                          const r = imageData.data[i];
                          const g = imageData.data[i+1];
                          const b = imageData.data[i+2];
                          const a = imageData.data[i+3];
                          if (a < 10) newPixels.push('transparent');
                          else newPixels.push(`rgb(${r},${g},${b})`);
                      }
                      saveToHistory(newPixels);
                  }
              };
              img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
      }
  }

  const handleAiRefine = async () => {
      if (!isOnline) return;
      if (!canvasRef.current || !prompt) return;
      setIsProcessing(true);
      try {
          const base64 = canvasRef.current.toDataURL().split(',')[1];
          const refinedBase64 = await editTextureWithAi(
              base64, 
              `Context: ${resolution}x${resolution} item texture. Requirement: ${prompt}`, 
              'image/png'
          );

          if (refinedBase64) {
              const img = new Image();
              img.onload = () => {
                   const ctx = canvasRef.current?.getContext('2d');
                   if (ctx) {
                        ctx.clearRect(0,0,resolution, resolution);
                        ctx.drawImage(img, 0, 0, resolution, resolution);
                        // Extract pixels back to state
                        const imageData = ctx.getImageData(0, 0, resolution, resolution);
                        const newPixels = [];
                        for (let i = 0; i < imageData.data.length; i += 4) {
                            const r = imageData.data[i];
                            const g = imageData.data[i+1];
                            const b = imageData.data[i+2];
                            const a = imageData.data[i+3];
                            if (a < 10) newPixels.push('transparent');
                            else newPixels.push(`rgb(${r},${g},${b})`);
                        }
                        saveToHistory(newPixels);
                   }
              };
              img.src = `data:image/png;base64,${refinedBase64}`;
          }
      } catch (e) {
          console.error(e);
          alert('Error al generar con IA');
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="flex h-full bg-gray-950">
      {/* Left Toolbar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-6">
        <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Herramientas</h3>
            <div className="grid grid-cols-4 gap-2">
                {[
                    { id: 'pencil', icon: PenTool },
                    { id: 'eraser', icon: Eraser },
                    { id: 'bucket', icon: PaintBucket },
                    { id: 'picker', icon: Pipette },
                ].map(t => (
                    <button 
                        key={t.id}
                        onClick={() => setTool(t.id as Tool)}
                        className={`p-2 rounded ${tool === t.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        title={t.id}
                    >
                        <t.icon size={18} />
                    </button>
                ))}
            </div>
             <button 
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-300 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
            >
                <Undo size={14} /> Deshacer
            </button>
        </div>

        <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Resolución</h3>
            <div className="flex gap-2">
                {RESOLUTIONS.map(res => (
                    <button
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`flex-1 py-1 text-xs rounded border ${resolution === res ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                    >
                        {res}x
                    </button>
                ))}
            </div>
        </div>

        <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Paleta</h3>
            <div className="grid grid-cols-8 gap-1">
                {PALETTE.map(c => (
                    <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-6 h-6 rounded-sm border ${selectedColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
                <input 
                    type="color" 
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full h-8 bg-transparent cursor-pointer rounded"
                />
            </div>
        </div>

        <div className="mt-auto">
            <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Acciones</h3>
             <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-3 rounded cursor-pointer mb-2">
                <Upload size={16} />
                <span className="text-sm">Importar Imagen</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
            <button 
                onClick={handleDownload}
                className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded"
            >
                <Download size={16} />
                <span className="text-sm">Descargar PNG</span>
            </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
          
          {/* Zoom Controls Overlay */}
          <div className="absolute top-4 right-4 flex gap-2 bg-gray-800 p-1 rounded shadow-lg z-20 border border-gray-700">
             <button onClick={() => setZoom(z => Math.max(1, z - 2))} className="p-2 hover:bg-gray-700 rounded text-gray-300"><ZoomOut size={16}/></button>
             <span className="p-2 text-xs font-mono text-gray-400 w-12 text-center flex items-center justify-center">{zoom}x</span>
             <button onClick={() => setZoom(z => Math.min(64, z + 2))} className="p-2 hover:bg-gray-700 rounded text-gray-300"><ZoomIn size={16}/></button>
          </div>

          {/* Canvas Viewport */}
          <div className="flex-1 overflow-auto bg-[#1a1a1a] flex p-8 relative"
               style={{ backgroundImage: 'radial-gradient(#2a2a2a 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              
              <div className="m-auto bg-white shadow-2xl border-2 border-gray-600 image-pixelated flex-shrink-0">
                  <canvas 
                    ref={canvasRef}
                    width={resolution}
                    height={resolution}
                    onMouseDown={handleCanvasClick}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="cursor-crosshair image-pixelated block"
                    style={{ width: resolution * zoom, height: resolution * zoom }}
                  />
              </div>
          </div>

          {/* AI Bar */}
          <div className="h-20 bg-gray-900 border-t border-gray-800 p-4 flex items-center gap-4 z-20">
               <div className="bg-purple-900/20 p-2 rounded-lg">
                   {isOnline ? <Sparkles className="text-purple-400" /> : <WifiOff className="text-gray-500" />}
               </div>
               <div className="flex-1">
                   <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={isOnline ? "IA Helper: 'Añade sombras', 'hazlo parecer de oro'..." : "Conecta a internet para usar la IA"}
                        disabled={!isOnline}
                        className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                   />
               </div>
               <button 
                    onClick={handleAiRefine}
                    disabled={isProcessing || !prompt || !isOnline}
                    className={`bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${!isOnline ? 'grayscale' : ''}`}
               >
                   {isProcessing ? <RefreshCcw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                   <span>Refinar con IA</span>
               </button>
          </div>
      </div>
    </div>
  );
};

export default TextureEditor;