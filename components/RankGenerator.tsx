import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Type, Move, Palette, Layers } from 'lucide-react';
import { RankSettings } from '../types';

const PRESET_ICONS = ['👑', '⚔️', '🛡️', '💎', '🏹', '⭐', '💀', '🔥', '⚡', '💊', '🔧', '🔨', '⚜️', '🐲'];
const FONTS = [
  { name: 'Default Pixel', value: 'VT323' },
  { name: 'Minecraft Classic', value: 'Press Start 2P' },
  { name: 'Modern Arcade', value: 'Silkscreen' },
  { name: 'Rounded Pixel', value: 'Pixelify Sans' },
  { name: 'Standard Sans', value: 'sans-serif' },
];

const RankGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [settings, setSettings] = useState<RankSettings & { transparentBg: boolean, bgType: 'solid' | 'gradient', bgColor2: string }>({
    text: 'ADMIN',
    textColor: '#ffffff',
    bgColor: '#000000',
    bgColor2: '#333333',
    bgType: 'solid',
    borderColor: '#ff5555',
    borderWidth: 2,
    width: 128, 
    height: 32, 
    icon: '👑',
    iconX: 10,
    iconY: 20,
    textX: 34,
    textY: 22,
    fontSize: 16,
    fontFamily: 'Press Start 2P',
    borderStyle: 'solid',
    borderStartX: 0,
    borderEndX: 128,
    enableShadow: true,
    transparentBg: false
  });

  const [savedRanks, setSavedRanks] = useState<string[]>([]);

  // Draw function
  useEffect(() => {
    // Force font load check roughly
    document.fonts.ready.then(() => {
        draw();
    });
  }, [settings]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disable image smoothing for pixel art look
    ctx.imageSmoothingEnabled = false;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    if (!settings.transparentBg) {
        if (settings.bgType === 'gradient') {
            const grad = ctx.createLinearGradient(0, 0, 0, settings.height);
            grad.addColorStop(0, settings.bgColor);
            grad.addColorStop(1, settings.bgColor2);
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = settings.bgColor;
        }
        ctx.fillRect(0, 0, settings.width, settings.height);
    }

    // Draw Border Logic
    ctx.strokeStyle = settings.borderColor;
    ctx.lineWidth = settings.borderWidth;
    
    // Pixel-perfect line drawing helper
    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
        ctx.beginPath();
        if (settings.borderStyle === 'dashed') ctx.setLineDash([4, 2]);
        else if (settings.borderStyle === 'dotted') ctx.setLineDash([2, 2]);
        else ctx.setLineDash([]);

        ctx.moveTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
        ctx.lineTo(Math.floor(x2) + 0.5, Math.floor(y2) + 0.5);
        ctx.stroke();
    };

    // Top & Bottom Border
    if (settings.borderStartX < settings.borderEndX) {
        // Adjust Y positions to be inside canvas
        const topY = Math.ceil(settings.borderWidth / 2);
        const botY = settings.height - Math.ceil(settings.borderWidth / 2);

        drawLine(Math.max(0, settings.borderStartX), topY, Math.min(settings.width, settings.borderEndX), topY);
        drawLine(Math.max(0, settings.borderStartX), botY, Math.min(settings.width, settings.borderEndX), botY);
        
        if (settings.borderStyle === 'double') {
             drawLine(Math.max(0, settings.borderStartX), topY + 2, Math.min(settings.width, settings.borderEndX), topY + 2);
             drawLine(Math.max(0, settings.borderStartX), botY - 2, Math.min(settings.width, settings.borderEndX), botY - 2);
        }
    }

    // Draw Icon (Emoji)
    if (settings.icon) {
      // Use standard sans-serif for emojis to ensure they render, or system font
      // Scale emoji slightly down to avoid clash if needed
      const iconSize = settings.fontSize * 1.1; 
      ctx.font = `${iconSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`; 
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (settings.enableShadow) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillText(settings.icon, settings.iconX + 1, settings.iconY + 1);
      }
      
      // Emoji usually has its own color, fillStyle might not affect it depending on browser/OS
      ctx.fillStyle = "#ffffff";
      ctx.fillText(settings.icon, settings.iconX, settings.iconY);
    }

    // Draw Text using Pixel Font
    ctx.font = `${settings.fontSize}px "${settings.fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic'; 
    
    if (settings.enableShadow) {
        ctx.fillStyle = "#3f3f3f"; // Minecraft shadow color roughly
        ctx.fillText(settings.text, settings.textX + 2, settings.textY + 2);
    }
    
    ctx.fillStyle = settings.textColor;
    ctx.fillText(settings.text, settings.textX, settings.textY);
  }

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `rango-${settings.text}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setSavedRanks(prev => [...prev, canvas.toDataURL()]);
    }
  };

  return (
    <div className="flex h-full">
      {/* Controls Area */}
      <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-800 bg-gray-900/50 custom-scrollbar">
        <h2 className="text-2xl font-bold mb-6 text-blue-400 flex items-center gap-2 font-pixel">
            <Type /> Generador de Rangos Pixel
        </h2>
        
        <div className="space-y-6">
          {/* Main Inputs */}
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Texto del Rango</label>
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={settings.text}
                      onChange={(e) => setSettings({...settings, text: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                      style={{ fontFamily: settings.fontFamily }}
                    />
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Fuente</label>
                <div className="grid grid-cols-1 gap-2">
                    {FONTS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setSettings({...settings, fontFamily: f.value})}
                            className={`px-3 py-2 rounded text-left border ${settings.fontFamily === f.value ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'}`}
                            style={{ fontFamily: f.value }}
                        >
                            {f.name} - Example
                        </button>
                    ))}
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Color Texto</label>
                  <div className="flex items-center space-x-2 bg-gray-800 p-1 rounded border border-gray-700">
                    <input 
                      type="color" 
                      value={settings.textColor}
                      onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                      className="h-8 w-8 bg-transparent border-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 font-mono">{settings.textColor}</span>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Color Borde</label>
                  <div className="flex items-center space-x-2 bg-gray-800 p-1 rounded border border-gray-700">
                    <input 
                      type="color" 
                      value={settings.borderColor}
                      onChange={(e) => setSettings({...settings, borderColor: e.target.value})}
                      className="h-8 w-8 bg-transparent border-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 font-mono">{settings.borderColor}</span>
                  </div>
               </div>
             </div>

             {/* Background Color Config */}
             <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Palette size={14} /> Fondo del Rango
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={settings.transparentBg}
                            onChange={e => setSettings({...settings, transparentBg: e.target.checked})}
                            className="rounded bg-gray-700 border-gray-600 text-blue-500"
                        />
                        <span className="text-xs text-gray-400">Transparente</span>
                    </label>
                </div>
                {!settings.transparentBg && (
                    <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Tipo de Fondo</span>
                            <div className="flex bg-gray-700 rounded p-0.5">
                                <button 
                                    onClick={() => setSettings({...settings, bgType: 'solid'})}
                                    className={`px-2 py-0.5 text-xs rounded ${settings.bgType === 'solid' ? 'bg-gray-500 text-white' : 'text-gray-400'}`}
                                >Sólido</button>
                                <button 
                                    onClick={() => setSettings({...settings, bgType: 'gradient'})}
                                    className={`px-2 py-0.5 text-xs rounded ${settings.bgType === 'gradient' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                                >Gradiente</button>
                            </div>
                         </div>

                         <div className="flex items-center space-x-2">
                            <input 
                            type="color" 
                            value={settings.bgColor}
                            onChange={(e) => setSettings({...settings, bgColor: e.target.value})}
                            className="h-8 w-full bg-transparent cursor-pointer rounded"
                            title="Color Primario"
                            />
                            {settings.bgType === 'gradient' && (
                                <input 
                                type="color" 
                                value={settings.bgColor2}
                                onChange={(e) => setSettings({...settings, bgColor2: e.target.value})}
                                className="h-8 w-full bg-transparent cursor-pointer rounded"
                                title="Color Secundario"
                                />
                            )}
                         </div>
                     </div>
                )}
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Estilo de Borde</label>
                <div className="flex gap-2">
                    {['solid', 'dashed', 'dotted', 'double'].map((style) => (
                        <button
                            key={style}
                            onClick={() => setSettings({...settings, borderStyle: style as any})}
                            className={`flex-1 py-1 px-2 rounded text-xs capitalize border ${settings.borderStyle === style ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-gray-700 text-gray-400'}`}
                        >
                            {style}
                        </button>
                    ))}
                </div>
             </div>
          </div>

          <div className="h-px bg-gray-800 my-4"></div>

          {/* Sliders */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                    <Move size={14} /> Posicionamiento
                </h3>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={settings.enableShadow}
                        onChange={e => setSettings({...settings, enableShadow: e.target.checked})}
                        className="rounded bg-gray-700 border-gray-600 text-blue-500"
                    />
                    <span className="text-xs text-gray-400">Sombra</span>
                </label>
             </div>
             
             {[
               { label: 'Posición Icono X', key: 'iconX', min: 0, max: settings.width },
               { label: 'Posición Icono Y', key: 'iconY', min: 0, max: settings.height },
               { label: 'Posición Texto X', key: 'textX', min: 0, max: settings.width },
               { label: 'Posición Texto Y', key: 'textY', min: 0, max: settings.height + 20 },
               { label: 'Inicio Borde X', key: 'borderStartX', min: -10, max: settings.width },
               { label: 'Fin Borde X', key: 'borderEndX', min: 0, max: settings.width + 10 },
               { label: 'Tamaño Fuente', key: 'fontSize', min: 8, max: 48 },
               { label: 'Ancho Total', key: 'width', min: 64, max: 256 },
             ].map((slider) => (
               <div key={slider.key}>
                 <div className="flex justify-between mb-1">
                   <label className="text-xs font-medium text-gray-500 uppercase">{slider.label}</label>
                   <span className="text-xs text-blue-400 font-mono">{settings[slider.key as keyof RankSettings]}px</span>
                 </div>
                 <input 
                   type="range"
                   min={slider.min}
                   max={slider.max}
                   value={settings[slider.key as keyof typeof settings] as number}
                   onChange={(e) => setSettings({...settings, [slider.key]: Number(e.target.value)})}
                   className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                 />
               </div>
             ))}
          </div>

          <div className="h-px bg-gray-800 my-4"></div>

          {/* Icon Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Icono</label>
            <div className="grid grid-cols-7 gap-2">
              {PRESET_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setSettings({...settings, icon})}
                  className={`p-1 aspect-square flex items-center justify-center rounded hover:bg-gray-700 text-lg border ${settings.icon === icon ? 'border-blue-500 bg-gray-700' : 'border-transparent'}`}
                >
                  {icon}
                </button>
              ))}
              <button
                  onClick={() => setSettings({...settings, icon: ''})}
                  className={`p-1 aspect-square flex items-center justify-center rounded hover:bg-gray-700 text-xs border border-dashed border-gray-600 text-gray-500`}
                >
                  NONE
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="w-1/2 bg-[#1a1a1a] p-8 flex flex-col items-center justify-center relative bg-opacity-95" 
           style={{ backgroundImage: 'radial-gradient(#2a2a2a 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        
        <div className="bg-[#363636] p-1 rounded border-2 border-gray-600 shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
           {/* Canvas rendered with pixelated css */}
           <canvas 
             ref={canvasRef}
             width={settings.width}
             height={settings.height}
             className="image-pixelated"
             style={{ 
                 width: settings.width * 3, 
                 height: settings.height * 3,
                 backgroundImage: settings.transparentBg ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==")' : 'none'
             }} 
           />
        </div>
        
        <p className="text-gray-500 text-xs mb-8 font-mono">
            Vista previa aumentada 3x.
        </p>

        <div className="flex space-x-4">
          <button 
            onClick={handleSave}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Save size={18} />
            <span>Guardar</span>
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/30"
          >
            <Download size={18} />
            <span>Descargar PNG</span>
          </button>
        </div>

        {/* Saved Ranks Strip */}
        {savedRanks.length > 0 && (
          <div className="mt-12 w-full">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Historial</h3>
            <div className="flex space-x-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
              {savedRanks.map((img, idx) => (
                <img 
                    key={idx} 
                    src={img} 
                    alt="saved rank" 
                    className="h-8 border border-gray-700 rounded image-pixelated hover:scale-150 transition-transform origin-bottom bg-gray-800" 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankGenerator;