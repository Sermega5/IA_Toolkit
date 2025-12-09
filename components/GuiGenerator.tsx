import React, { useState } from 'react';
import { Grid, Trash2, Package, Upload, Image as ImageIcon, X } from 'lucide-react';
import { GuiSlot } from '../types';

const GuiGenerator: React.FC = () => {
    const [guiName, setGuiName] = useState('menu_principal');
    const [title, setTitle] = useState('&8Menú del Servidor');
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [customBg, setCustomBg] = useState<string | null>(null);
    
    // Initialize 6 rows of 9 slots (54 total for double chest)
    const [slots, setSlots] = useState<GuiSlot[]>([]);

    const updateSlot = (index: number, data: Partial<GuiSlot>) => {
        const existing = slots.find(s => s.index === index);
        if (existing) {
            setSlots(slots.map(s => s.index === index ? { ...s, ...data } : s));
        } else {
            setSlots([...slots, { index, ...data }]);
        }
    };

    const getSlotData = (index: number) => slots.find(s => s.index === index);

    const generateYaml = () => {
        let yaml = `info:
  namespace: my_gui
guis:
  ${guiName}:
    display_name: '${title}'
    type: CHEST
    events:
      open:
        - 'sound: block.chest.open'
      close:
        - 'sound: block.chest.close'
    items:
`;
        slots.forEach(slot => {
            if (slot.item) {
                yaml += `      '${slot.index}':\n`;
                yaml += `        item: ${slot.item}\n`;
                if (slot.action) {
                   yaml += `        commands:\n          - '${slot.action}'\n`;
                }
            }
        });
        return yaml;
    };

    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setCustomBg(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex h-full bg-gray-950 p-6 overflow-hidden">
            <div className="flex flex-col w-2/3 pr-6 h-full">
                <div className="mb-4 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                             <Grid className="text-orange-500" /> Diseñador de GUI (Config)
                        </h2>
                        <p className="text-gray-400 text-sm">Configura la lógica del menú. Sube un fondo para alinear los slots.</p>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 p-8 flex items-center justify-center overflow-auto relative">
                    {/* The Container for the GUI */}
                    <div className="relative inline-block shadow-2xl">
                        {/* Custom Background Layer */}
                        {customBg ? (
                            <img 
                                src={customBg} 
                                alt="Custom Background" 
                                className="absolute top-0 left-0 w-full h-full object-contain z-0 image-pixelated opacity-80"
                            />
                        ) : (
                            // Default grey background if no custom BG is uploaded
                            <div className="absolute inset-0 bg-[#c6c6c6] border-4 border-[#555555] rounded-lg z-0"></div>
                        )}

                        {/* Title Overlay (only if default BG is used mostly, but kept for reference) */}
                        {!customBg && (
                            <div className="absolute top-2 left-2 text-[#404040] font-bold font-pixel z-10 text-lg drop-shadow-sm">
                                {title.replace(/&[0-9a-f]/g, '')}
                            </div>
                        )}

                        {/* Grid Layer */}
                        <div className={`grid grid-cols-9 gap-[2px] p-2 relative z-10 ${customBg ? 'mt-0' : 'mt-6'}`} style={{ width: 'fit-content' }}>
                            {Array.from({ length: 54 }).map((_, i) => {
                                const slotData = getSlotData(i);
                                const isSelected = selectedSlot === i;
                                
                                // Clean item name for API
                                let rawItem = slotData?.item || '';
                                // Remove namespace if present
                                if (rawItem.includes(':')) rawItem = rawItem.split(':')[1];
                                
                                // Mineatar API is great for blocks/items rendered 3D
                                const iconUrl = rawItem ? `https://api.mineatar.io/item/${rawItem}` : '';

                                return (
                                    <div 
                                        key={i}
                                        onClick={() => setSelectedSlot(i)}
                                        className={`
                                            w-9 h-9 
                                            ${customBg ? 'border border-white/20 bg-white/5 hover:bg-white/10' : 'border-2 border-[#373737] border-r-white border-b-white bg-[#8b8b8b] hover:bg-[#9b9b9b]'}
                                            ${isSelected ? 'ring-2 ring-red-500 z-50' : ''}
                                            cursor-pointer relative
                                            flex items-center justify-center group transition-colors
                                        `}
                                    >
                                        {/* Slot Inner Shadow (only for default style) */}
                                        {!customBg && (
                                            <div className="absolute inset-0 border-t-[#373737] border-l-[#373737] border-2 pointer-events-none opacity-40"></div>
                                        )}
                                        
                                        {slotData?.item && (
                                            <div className="w-7 h-7 z-20 relative flex items-center justify-center">
                                                <img 
                                                    src={iconUrl} 
                                                    alt={rawItem}
                                                    className="w-full h-full object-contain image-pixelated drop-shadow-md"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement?.querySelector('.fallback-text')?.classList.remove('hidden');
                                                    }}
                                                />
                                                <span className="fallback-text hidden text-[6px] text-red-500 font-bold break-all leading-none text-center">
                                                    {rawItem.substring(0, 8)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Hover Number */}
                                        <span className="text-[8px] text-white absolute top-0 left-0 font-mono opacity-0 group-hover:opacity-100 bg-black/70 px-1 rounded pointer-events-none z-30">{i}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                {/* YAML Output */}
                <div className="mt-4 h-32 bg-gray-900 p-4 rounded border border-gray-800 font-mono text-xs text-green-400 overflow-auto custom-scrollbar whitespace-pre shadow-inner">
                    {generateYaml()}
                </div>
            </div>

            {/* Sidebar Controls */}
            <div className="w-1/3 bg-gray-900 border-l border-gray-800 p-6 flex flex-col h-full shadow-lg z-20 overflow-y-auto custom-scrollbar">
                 <div className="space-y-4 mb-8">
                     <h3 className="font-bold text-gray-300 border-b border-gray-700 pb-2 flex items-center gap-2">
                         <Package size={16}/> Configuración General
                     </h3>
                     
                     {/* Background Upload */}
                     <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                         <label className="block text-xs uppercase text-blue-400 font-bold mb-2 flex items-center gap-2">
                             <ImageIcon size={12} /> Fondo de Referencia
                         </label>
                         <div className="flex gap-2">
                             <label className="flex-1 cursor-pointer bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors">
                                 <Upload size={14} />
                                 {customBg ? 'Cambiar Imagen' : 'Subir Imagen (PNG)'}
                                 <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={handleBgUpload} />
                             </label>
                             {customBg && (
                                 <button 
                                    onClick={() => setCustomBg(null)}
                                    className="bg-red-900/50 hover:bg-red-900 text-red-200 p-2 rounded"
                                    title="Quitar fondo"
                                 >
                                     <X size={14} />
                                 </button>
                             )}
                         </div>
                         <p className="text-[10px] text-gray-500 mt-2">
                             Sube el diseño que hiciste en el "Diseñador de Fondo" para alinear los slots perfectamente.
                         </p>
                     </div>

                     <div>
                        <label className="block text-xs uppercase text-gray-500 font-bold mb-1">ID del Menú</label>
                        <input 
                            value={guiName}
                            onChange={(e) => setGuiName(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                        />
                     </div>
                     <div>
                        <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Título</label>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm font-mono focus:border-blue-500 outline-none transition-colors"
                        />
                     </div>
                 </div>

                 <h3 className="font-bold text-gray-300 border-b border-gray-700 pb-2 mb-4 flex justify-between items-center">
                     <span>Slot: <span className="text-blue-400 font-mono">{selectedSlot !== null ? selectedSlot : '-'}</span></span>
                     {selectedSlot !== null && getSlotData(selectedSlot) && (
                         <span className="text-[10px] bg-green-900 text-green-300 px-2 py-0.5 rounded">Configurado</span>
                     )}
                 </h3>

                 {selectedSlot !== null ? (
                     <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                         <div>
                            <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Material / Item ID</label>
                            <input 
                                placeholder="ej: diamond_sword"
                                value={getSlotData(selectedSlot)?.item || ''}
                                onChange={(e) => updateSlot(selectedSlot, { item: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm font-mono focus:border-blue-500 outline-none"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Soporta items vanilla (stone, grass_block) y custom.</p>
                         </div>
                         <div>
                            <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Comando / Acción</label>
                            <input 
                                placeholder="say Hola"
                                value={getSlotData(selectedSlot)?.action || ''}
                                onChange={(e) => updateSlot(selectedSlot, { action: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm font-mono focus:border-blue-500 outline-none"
                            />
                         </div>
                         
                         <button 
                            onClick={() => {
                                const newSlots = slots.filter(s => s.index !== selectedSlot);
                                setSlots(newSlots);
                            }}
                            className="flex items-center space-x-2 bg-red-900/20 hover:bg-red-900/50 text-red-400 hover:text-red-300 text-sm mt-6 w-full p-2 rounded justify-center transition-colors border border-red-900/30"
                         >
                             <Trash2 size={14} /> <span>Limpiar Slot</span>
                         </button>
                     </div>
                 ) : (
                     <div className="text-gray-500 text-sm italic bg-gray-800/50 p-4 rounded text-center border border-dashed border-gray-700">
                         Selecciona un slot en la cuadrícula para editar sus propiedades.
                     </div>
                 )}
            </div>
        </div>
    );
};

export default GuiGenerator;