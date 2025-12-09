import React, { useRef, useEffect, useState } from 'react';
import { Download, Layout, Type, Layers, PenTool, Eraser, PaintBucket, Sparkles, ZoomIn, ZoomOut, Undo, RefreshCcw, WifiOff } from 'lucide-react';
import { editTextureWithAi } from '../services/geminiService';

interface Element {
    id: number;
    type: 'slot' | 'text';
    x: number;
    y: number;
    w: number;
    h: number;
    text?: string;
}

const PALETTE = ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa', '#8b8b8b', '#373737', '#ffffff'];
const CANVAS_W = 176;
const CANVAS_H = 166;

type Tool = 'select' | 'pencil' | 'eraser' | 'bucket' | 'picker';

const BackgroundDesigner: React.FC = () => {
    // We maintain two layers: 
    // 1. Pixel Grid (raster) - Background painting
    // 2. Elements (vector) - Slots and text that float on top
    
    // Pixel State
    const [pixels, setPixels] = useState<string[]>(Array(CANVAS_W * CANVAS_H).fill('transparent'));
    const [history, setHistory] = useState<string[][]>([Array(CANVAS_W * CANVAS_H).fill('transparent')]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Vector State
    const [elements, setElements] = useState<Element[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    
    // Tool State
    const [tool, setTool] = useState<Tool>('select');
    const [selectedColor, setSelectedColor] = useState('#8b8b8b');
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Canvas View State
    const [zoom, setZoom] = useState(2);
    const [brushSize, setBrushSize] = useState(1);
    
    // AI
    const [aiPrompt, setAiPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    // Initialization: Draw default background grey on pixel layer once
    useEffect(() => {
        const init = Array(CANVAS_W * CANVAS_H).fill('#c6c6c6');
        setPixels(init);
        setHistory([init]);
    }, []);

    // Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // 1. Draw Raster Pixels
        const imgData = ctx.createImageData(CANVAS_W, CANVAS_H);
        for (let i = 0; i < pixels.length; i++) {
            const hex = pixels[i];
            // Simple hex parser for speed (assuming standard hex format or transparent)
            if (hex === 'transparent') {
                imgData.data[i * 4 + 3] = 0;
            } else {
                // Parse hex #RRGGBB
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                imgData.data[i * 4] = r;
                imgData.data[i * 4 + 1] = g;
                imgData.data[i * 4 + 2] = b;
                imgData.data[i * 4 + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // 2. Draw Vector Elements
        elements.forEach(el => {
            if (el.type === 'slot') {
                ctx.fillStyle = "#8b8b8b"; 
                ctx.fillRect(el.x, el.y, 18, 18);
                ctx.fillStyle = "#ffffff"; 
                ctx.fillRect(el.x + 17, el.y, 1, 18);
                ctx.fillRect(el.x, el.y + 17, 18, 1);
                ctx.fillStyle = "#373737"; 
                ctx.fillRect(el.x, el.y, 17, 1);
                ctx.fillRect(el.x, el.y, 1, 17);
            } else if (el.type === 'text') {
                ctx.font = "8px 'Minecraft Regular', sans-serif";
                ctx.fillStyle = "#404040";
                ctx.fillText(el.text || "Title", el.x, el.y + 8);
            }

            // Selection Outline
            if (el.id === selectedId && tool === 'select') {
                ctx.strokeStyle = "#ff0000";
                ctx.lineWidth = 1;
                ctx.strokeRect(el.x - 0.5, el.y - 0.5, el.w + 1, el.h + 1);
            }
        });

    }, [pixels, elements, selectedId, tool]);

    // --- Vector Logic ---

    const addElement = (type: 'slot' | 'text') => {
        const newEl: Element = {
            id: Date.now(),
            type,
            x: 10,
            y: 10,
            w: type === 'slot' ? 18 : 60,
            h: type === 'slot' ? 18 : 10,
            text: type === 'text' ? "Inventory" : undefined
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
        setTool('select');
    };

    const addGrid = () => {
        const newEls = [];
        for(let y=0; y<3; y++) {
            for(let x=0; x<9; x++) {
                newEls.push({
                    id: Date.now() + x + y * 10,
                    type: 'slot' as const,
                    x: 7 + x * 18,
                    y: 17 + y * 18,
                    w: 18, h: 18
                });
            }
        }
        setElements([...elements, ...newEls]);
        setTool('select');
    };

    const updateSelected = (key: keyof Element, value: any) => {
        if (!selectedId) return;
        setElements(elements.map(el => el.id === selectedId ? { ...el, [key]: value } : el));
    };

    // --- Raster Logic (Painting) ---

    const saveToHistory = (newPixels: string[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newPixels);
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
        if (!canvas) return { idx: -1, x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);
        if (x < 0 || x >= CANVAS_W || y < 0 || y >= CANVAS_H) return { idx: -1, x: 0, y: 0 };
        return { idx: y * CANVAS_W + x, x, y };
    };

    const bakeElements = () => {
        // Render elements onto the pixel grid PERMANENTLY so they can be painted over
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        const newPixels = [];
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i+1];
            const b = imageData.data[i+2];
            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            newPixels.push(hex);
        }
        
        saveToHistory(newPixels);
        setElements([]); // Clear vector elements as they are now baked
        setSelectedId(null);
    };

    // --- Paint Handlers ---

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (tool === 'select') {
            const rect = canvasRef.current!.getBoundingClientRect();
            const scaleX = canvasRef.current!.width / rect.width;
            const scaleY = canvasRef.current!.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            const hit = [...elements].reverse().find(el => 
                x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h
            );
            setSelectedId(hit ? hit.id : null);
            return;
        }

        const { idx, x, y } = getPixelIndex(e);
        if (idx === -1) return;

        if (tool === 'bucket') {
            const targetColor = pixels[idx];
            const newPixels = [...pixels];
            const queue = [idx];
            const visited = new Set([idx]);
            while(queue.length > 0) {
                const i = queue.pop()!;
                newPixels[i] = selectedColor;
                const curX = i % CANVAS_W;
                const curY = Math.floor(i / CANVAS_W);
                const neighbors = [
                    { nx: curX + 1, ny: curY }, { nx: curX - 1, ny: curY }, { nx: curX, ny: curY + 1 }, { nx: curX, ny: curY - 1 }
                ];
                for(const n of neighbors) {
                    if(n.nx >= 0 && n.nx < CANVAS_W && n.ny >=0 && n.ny < CANVAS_H) {
                        const ni = n.ny * CANVAS_W + n.nx;
                        if(!visited.has(ni) && newPixels[ni] === targetColor) {
                            visited.add(ni);
                            queue.push(ni);
                        }
                    }
                }
            }
            saveToHistory(newPixels);
        } else if (tool === 'picker') {
             setSelectedColor(pixels[idx]);
             setTool('pencil');
        } else {
            setIsDrawing(true);
            paint(x, y);
        }
    };

    const paint = (x: number, y: number) => {
        const color = tool === 'eraser' ? '#c6c6c6' : selectedColor;
        const newPixels = [...pixels];
        
        // Handle Brush Size
        let modified = false;
        for (let dy = 0; dy < brushSize; dy++) {
            for (let dx = 0; dx < brushSize; dx++) {
                const px = x + dx;
                const py = y + dy;
                if (px < CANVAS_W && py < CANVAS_H) {
                     const i = py * CANVAS_W + px;
                     if (newPixels[i] !== color) {
                         newPixels[i] = color;
                         modified = true;
                     }
                }
            }
        }
        
        if (modified) {
            setPixels(newPixels);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const { idx, x, y } = getPixelIndex(e);
        if (idx !== -1) paint(x, y);
    };

    const handleCanvasMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory(pixels);
        }
    };

    const handleDownload = () => {
        if (!canvasRef.current) return;
        
        // Create a temporary canvas to scale up the image
        const tempCanvas = document.createElement('canvas');
        // Scale 4x for visibility
        const scale = 4;
        tempCanvas.width = CANVAS_W * scale;
        tempCanvas.height = CANVAS_H * scale;
        const ctx = tempCanvas.getContext('2d');
        
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
            
            const link = document.createElement('a');
            link.download = 'custom_gui_4x.png';
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
        }
    };

    // --- AI Logic ---
    const handleAiRefine = async () => {
        if (!isOnline) return;
        if (!canvasRef.current || !aiPrompt) return;
        
        // First bake elements so AI sees everything
        if (elements.length > 0) {
            const confirmBake = window.confirm("La IA necesita 'hornear' los elementos (slots) en la imagen para editarlos. ¿Continuar?");
            if(!confirmBake) return;
            bakeElements();
            setTimeout(executeAi, 100);
        } else {
            executeAi();
        }
    };

    const executeAi = async () => {
        if (!canvasRef.current) return;
        setIsProcessing(true);
        try {
             const base64 = canvasRef.current.toDataURL().split(',')[1];
             const refinedBase64 = await editTextureWithAi(
                  base64,
                  `Context: Minecraft GUI Background. Requirement: ${aiPrompt}. Ensure slots remain visible if present.`,
                  'image/png'
             );

             if (refinedBase64) {
                 const img = new Image();
                 img.onload = () => {
                      const ctx = canvasRef.current?.getContext('2d');
                      if (ctx) {
                           ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
                           // Extract back to pixels
                           const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
                           const newPixels = [];
                           for (let i = 0; i < imageData.data.length; i += 4) {
                               const r = imageData.data[i];
                               const g = imageData.data[i+1];
                               const b = imageData.data[i+2];
                               const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                               newPixels.push(hex);
                           }
                           saveToHistory(newPixels);
                           // Clear elements since AI replaced them
                           setElements([]);
                      }
                 };
                 img.src = `data:image/png;base64,${refinedBase64}`;
             }
        } catch (e) {
            console.error(e);
            alert("Error con la IA.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex h-full bg-gray-950 p-6 overflow-hidden">
            {/* Toolbar */}
            <div className="w-64 border-r border-gray-800 pr-4 flex flex-col gap-6 custom-scrollbar overflow-y-auto">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <Layout className="text-pink-500" /> Designer BG
                    </h2>
                    
                    {/* Layer Mode Switch */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button 
                            onClick={() => setTool('select')} 
                            className={`p-2 rounded flex items-center justify-center gap-2 text-xs font-bold ${tool === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                        >
                            <Layout size={14} /> Elementos
                        </button>
                        <button 
                            onClick={() => setTool('pencil')} 
                            className={`p-2 rounded flex items-center justify-center gap-2 text-xs font-bold ${tool !== 'select' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                        >
                            <PenTool size={14} /> Pintar
                        </button>
                    </div>

                    {tool === 'select' ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-left-4">
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Modo Vectorial</p>
                            <button onClick={addGrid} className="w-full bg-gray-800 hover:bg-gray-700 text-white p-2 rounded text-sm flex items-center gap-2">
                                <Layout size={14} /> Grid 9x3
                            </button>
                            <button onClick={() => addElement('slot')} className="w-full bg-gray-800 hover:bg-gray-700 text-white p-2 rounded text-sm flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-500 border border-gray-300" /> Slot Único
                            </button>
                            <button onClick={() => addElement('text')} className="w-full bg-gray-800 hover:bg-gray-700 text-white p-2 rounded text-sm flex items-center gap-2">
                                <Type size={14} /> Texto
                            </button>
                            
                            <div className="my-4 border-t border-gray-800 pt-4">
                                <button onClick={bakeElements} className="w-full bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-200 p-2 rounded text-xs flex items-center justify-center gap-2 border border-yellow-800">
                                    <Layers size={14} /> "Hornear" Elementos
                                </button>
                                <p className="text-[10px] text-gray-500 mt-1 leading-tight">Convierte los slots en pixeles para poder pintar sobre ellos.</p>
                            </div>

                            {selectedId && (
                                <div className="p-3 bg-gray-900 rounded border border-gray-700 space-y-3 mt-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase">Propiedades</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-gray-400">X</label>
                                            <input type="number" 
                                                value={elements.find(e => e.id === selectedId)?.x} 
                                                onChange={(e) => updateSelected('x', Number(e.target.value))}
                                                className="w-full bg-gray-800 border border-gray-600 rounded text-xs p-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400">Y</label>
                                            <input type="number" 
                                                value={elements.find(e => e.id === selectedId)?.y} 
                                                onChange={(e) => updateSelected('y', Number(e.target.value))}
                                                className="w-full bg-gray-800 border border-gray-600 rounded text-xs p-1"
                                            />
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        setElements(elements.filter(el => el.id !== selectedId));
                                        setSelectedId(null);
                                    }} className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 p-1 rounded text-xs">
                                        Eliminar
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Modo Pixel Art</p>
                            
                            {/* Brush Size */}
                            <div className="mb-2">
                                <label className="text-[10px] text-gray-400 block mb-1">Tamaño Pincel</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => setBrushSize(s)}
                                            className={`flex-1 py-1 rounded text-[10px] border ${brushSize === s ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-800'}`}
                                        >
                                            {s}px
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-1">
                                {[
                                    {id: 'pencil', icon: PenTool},
                                    {id: 'eraser', icon: Eraser},
                                    {id: 'bucket', icon: PaintBucket},
                                    {id: 'picker', icon: ZoomIn}
                                ].map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => setTool(t.id as Tool)}
                                        className={`p-2 rounded ${tool === t.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                                    >
                                        <t.icon size={16} />
                                    </button>
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-7 gap-1">
                                {PALETTE.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setSelectedColor(c); setTool('pencil'); }}
                                        className={`w-6 h-6 rounded-sm border ${selectedColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                             <input 
                                type="color" 
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-full h-6 bg-transparent cursor-pointer rounded"
                            />

                            <button onClick={handleUndo} className="w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-300 py-1 rounded hover:bg-gray-700 text-xs">
                                <Undo size={12} /> Deshacer
                            </button>
                        </div>
                    )}
                </div>
                
                {/* AI Section */}
                <div className="mt-auto bg-gray-900 p-3 rounded-lg border border-purple-900/50">
                    <h3 className={`text-xs font-bold flex items-center gap-1 mb-2 ${isOnline ? 'text-purple-400' : 'text-gray-500'}`}>
                        {isOnline ? <Sparkles size={12} /> : <WifiOff size={12}/>}
                        {isOnline ? "IA Magic" : "IA Desactivada"}
                    </h3>
                    <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={isOnline ? "Ej: Haz el fondo de piedra musgosa..." : "Requiere internet..."}
                        disabled={!isOnline}
                        className={`w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs h-20 mb-2 resize-none ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <button 
                        onClick={handleAiRefine}
                        disabled={isProcessing || !aiPrompt || !isOnline}
                        className={`w-full bg-purple-600 hover:bg-purple-500 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${!isOnline ? 'grayscale' : ''}`}
                    >
                        {isProcessing ? <RefreshCcw className="animate-spin" size={12} /> : "Generar"}
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex flex-col items-center justify-center bg-[#1a1a1a] relative"
                 style={{ backgroundImage: 'radial-gradient(#2a2a2a 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 flex gap-2 bg-gray-800 p-1 rounded shadow-lg">
                    <button onClick={() => setZoom(Math.max(1, zoom - 0.5))} className="p-2 hover:bg-gray-700 rounded text-gray-300"><ZoomOut size={16}/></button>
                    <span className="p-2 text-xs font-mono text-gray-400 w-12 text-center">{zoom}x</span>
                    <button onClick={() => setZoom(Math.min(10, zoom + 0.5))} className="p-2 hover:bg-gray-700 rounded text-gray-300"><ZoomIn size={16}/></button>
                </div>

                <div className="bg-[#121212] p-8 rounded shadow-2xl relative overflow-auto max-w-full max-h-full">
                    <div className="absolute top-2 left-2 text-gray-500 text-xs font-mono">176x166 (GUI Estándar)</div>
                    <canvas 
                        ref={canvasRef}
                        width={CANVAS_W} 
                        height={CANVAS_H}
                        className={`image-pixelated shadow-lg ${tool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
                        style={{ 
                            width: CANVAS_W * zoom, 
                            height: CANVAS_H * zoom 
                        }}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                    />
                </div>
                <div className="mt-8">
                    <button 
                        onClick={handleDownload} 
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded shadow-lg flex items-center gap-2"
                    >
                        <Download size={18} /> Descargar PNG (4x Upscaled)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackgroundDesigner;