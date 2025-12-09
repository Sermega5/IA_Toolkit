import React, { useRef, useEffect, useState } from 'react';
import { Download, Layout, Type, Layers, PenTool, Eraser, PaintBucket, Sparkles, ZoomIn, ZoomOut, Undo, RefreshCcw, Pipette, WifiOff } from 'lucide-react';
import { generateLayoutWithGemini } from '../services/geminiService';

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
        const newPixels = [...pixels];
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i+1];
            const b = imageData.data[i+2];
            const a = imageData.data[i+3];
            
            // Only update non-transparent baked pixels
            if (a > 0) {
                // simple hex conversion
                const hex = '#' + 
                    r.toString(16).padStart(2,'0') + 
                    g.toString(16).padStart(2,'0') + 
                    b.toString(16).padStart(2,'0');
                
                const idx = i / 4;
                newPixels[idx] = hex;
            }
        }
        
        setElements([]);
        saveToHistory(newPixels);
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        // Check for element selection first if tool is select
        if (tool === 'select') {
            const { x, y } = getPixelIndex(e);
            const clickedEl = elements.find(el => 
                x >= el.x && x < el.x + el.w && y >= el.y && y < el.y + el.h
            );
            if (clickedEl) {
                setSelectedId(clickedEl.id);
                return;
            } else {
                setSelectedId(null);
            }
        }

        // Painting Logic
        if (['pencil', 'eraser', 'bucket'].includes(tool)) {
            const { idx } = getPixelIndex(e);
            if (idx === -1) return;

            if (tool === 'bucket') {
                // Simple fill logic (simplified for grid)
                // For a 176x166 canvas, flood fill is heavy, let's do simple fill for now or limited
                // Actually let's implement basic flood fill
                const targetColor = pixels[idx];
                const replaceColor = selectedColor;
                if (targetColor !== replaceColor) {
                   // BFS Fill
                   const queue = [idx];
                   const visited = new Set([idx]);
                   const newPixels = [...pixels];
                   
                   while(queue.length) {
                       const i = queue.pop()!;
                       newPixels[i] = replaceColor;
                       
                       const cx = i % CANVAS_W;
                       const cy = Math.floor(i / CANVAS_W);
                       
                       const neighbors = [
                           {x: cx+1, y: cy}, {x: cx-1, y: cy},
                           {x: cx, y: cy+1}, {x: cx, y: cy-1}
                       ];
                       
                       for(const n of neighbors) {
                           if (n.x >=0 && n.x < CANVAS_W && n.y >=0 && n.y < CANVAS_H) {
                               const ni = n.y * CANVAS_W + n.x;
                               if (!visited.has(ni) && pixels[ni] === targetColor) {
                                   visited.add(ni);
                                   queue.push(ni);
                               }
                           }
                       }
                   }
                   saveToHistory(newPixels);
                }
            } else {
                setIsDrawing(true);
                paint(e);
            }
        } else if (tool === 'picker') {
             const { idx } = getPixelIndex(e);
             if (idx !== -1) {
                 setSelectedColor(pixels[idx]);
                 setTool('pencil');
             }
        }
    };

    const paint = (e: React.MouseEvent) => {
        const { idx, x, y } = getPixelIndex(e);
        if (idx === -1) return;
        
        const color = tool === 'eraser' ? 'transparent' : selectedColor;
        const newPixels = [...pixels];
        
        // Brush Size Logic
        const half = Math.floor(brushSize / 2);
        for(let by = -half; by <= half; by++) {
            for(let bx = -half; bx <= half; bx++) {
                const px = x + bx;
                const py = y + by;
                if (px >= 0 && px < CANVAS_W && py >= 0 && py < CANVAS_H) {
                    const pIdx = py * CANVAS_W + px;
                    newPixels[pIdx] = color;
                }
            }
        }
        
        setPixels(newPixels);
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        paint(e);
    };

    const handleDownload = () => {
        // Create a temp canvas scaled up for download (e.g., 4x)
        const scale = 4;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = CANVAS_W * scale;
        tempCanvas.height = CANVAS_H * scale;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        
        ctx.imageSmoothingEnabled = false;
        
        // Render current view to it
        ctx.drawImage(canvasRef.current!, 0, 0, tempCanvas.width, tempCanvas.height);
        
        const link = document.createElement('a');
        link.download = `custom_gui_background.png`;
        link.href = tempCanvas.toDataURL();
        link.click();
    };

    // AI Layout Generation
    const handleGenerateLayout = async () => {
        if (!isOnline) return;
        if (!aiPrompt) return;
        
        setIsProcessing(true);
        try {
            const layout = await generateLayoutWithGemini(aiPrompt);
            if (layout && Array.isArray(layout)) {
                // Map AI layout to elements
                const newElements: Element[] = layout.map((item: any, i: number) => ({
                    id: Date.now() + i,
                    type: (item.type === 'text' ? 'text' : 'slot') as 'slot' | 'text',
                    x: item.x || 10,
                    y: item.y || 10,
                    w: item.type === 'slot' ? 18 : 50,
                    h: item.type === 'slot' ? 18 : 10,
                    text: item.text
                }));
                // Clear existing and add new
                setElements(newElements);
            } else {
                alert("La IA no pudo generar un diseño válido.");
            }
        } catch (e) {
            console.error(e);
            alert("Error con la IA");
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
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'select', icon: Layout },
                            { id: 'pencil', icon: PenTool },
                            { id: 'eraser', icon: Eraser },
                            { id: 'bucket', icon: PaintBucket },
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
                     <div className="mt-4">
                        <label className="text-xs text-gray-500 font-bold uppercase">Tamaño Pincel: {brushSize}px</label>
                        <input 
                            type="range" 
                            min="1" max="4" 
                            value={brushSize} 
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer mt-1"
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Elementos</h3>
                    <button onClick={() => addElement('slot')} className="w-full mb-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-sm flex items-center justify-center gap-2">
                         <Layers size={14} /> Añadir Slot
                    </button>
                    <button onClick={() => addElement('text')} className="w-full mb-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-sm flex items-center justify-center gap-2">
                         <Type size={14} /> Añadir Texto
                    </button>
                    <button onClick={addGrid} className="w-full mb-4 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-sm flex items-center justify-center gap-2">
                         <Layout size={14} /> Añadir Grid 9x3
                    </button>
                    
                    <button onClick={bakeElements} className="w-full bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 border border-orange-900/50 py-2 rounded text-sm font-bold">
                        Fusionar Capas (Bake)
                    </button>
                    <p className="text-[10px] text-gray-500 mt-1 leading-tight">Fusiona los slots en el fondo para poder pintar encima de ellos.</p>
                </div>

                {selectedId && tool === 'select' && (
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                        <h4 className="text-xs font-bold text-white mb-2">Editar Elemento</h4>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                                <label className="text-[10px] text-gray-500">X</label>
                                <input type="number" 
                                    value={elements.find(e => e.id === selectedId)?.x} 
                                    onChange={(e) => updateSelected('x', parseInt(e.target.value))}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-1 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500">Y</label>
                                <input type="number" 
                                    value={elements.find(e => e.id === selectedId)?.y} 
                                    onChange={(e) => updateSelected('y', parseInt(e.target.value))}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-1 text-xs"
                                />
                            </div>
                        </div>
                        {elements.find(e => e.id === selectedId)?.type === 'text' && (
                            <div>
                                <label className="text-[10px] text-gray-500">Texto</label>
                                <input type="text"
                                    value={elements.find(e => e.id === selectedId)?.text} 
                                    onChange={(e) => updateSelected('text', e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-1 text-xs"
                                />
                            </div>
                        )}
                        <button 
                            onClick={() => {
                                setElements(elements.filter(e => e.id !== selectedId));
                                setSelectedId(null);
                            }}
                            className="w-full mt-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 py-1 rounded text-xs"
                        >
                            Eliminar
                        </button>
                    </div>
                )}
                 
                 <div className="mt-auto">
                     <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Paleta</h3>
                     <div className="grid grid-cols-6 gap-1 mb-2">
                        {PALETTE.map(c => (
                            <button
                                key={c}
                                onClick={() => { setSelectedColor(c); setTool('pencil'); }}
                                className={`w-5 h-5 rounded-sm border ${selectedColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                     </div>
                     <button 
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded"
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
                    <button onClick={() => setZoom(z => Math.max(1, z - 1))} className="p-2 hover:bg-gray-700 rounded text-gray-300"><ZoomOut size={16}/></button>
                    <span className="p-2 text-xs font-mono text-gray-400 w-12 text-center flex items-center justify-center">{zoom}x</span>
                    <button onClick={() => setZoom(z => Math.min(8, z + 1))} className="p-2 hover:bg-gray-700 rounded text-gray-300"><ZoomIn size={16}/></button>
                </div>

                <div className="flex-1 overflow-auto bg-[#1a1a1a] flex p-8 relative"
                     style={{ backgroundImage: 'radial-gradient(#2a2a2a 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    
                    <div className="m-auto bg-white shadow-2xl border-2 border-gray-600 image-pixelated flex-shrink-0">
                         <canvas 
                            ref={canvasRef}
                            width={CANVAS_W}
                            height={CANVAS_H}
                            onMouseDown={handleCanvasClick}
                            onMouseMove={handleMouseMove}
                            onMouseUp={() => setIsDrawing(false)}
                            onMouseLeave={() => setIsDrawing(false)}
                            className="cursor-crosshair image-pixelated block"
                            style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom }}
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
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder={isOnline ? "IA: 'Crea un inventario de doble cofre', 'menu de misiones'..." : "Conecta a internet para usar la IA"}
                                disabled={!isOnline}
                                className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                    <button 
                            onClick={handleGenerateLayout}
                            disabled={isProcessing || !aiPrompt || !isOnline}
                            className={`bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${!isOnline ? 'grayscale' : ''}`}
                    >
                        {isProcessing ? <RefreshCcw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        <span>Generar Layout</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackgroundDesigner;