import React, { useState } from 'react';
import { Grid, Trash2, Package } from 'lucide-react';
import { GuiSlot } from '../types';

const GuiGenerator: React.FC = () => {
    const [guiName, setGuiName] = useState('menu_principal');
    const [title, setTitle] = useState('&8Menú del Servidor');
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    
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

    const getTextureUrl = (itemName: string) => {
        if (!itemName) return null;
        // Strip namespace if present
        const cleanName = itemName.includes(':') ? itemName.split(':')[1] : itemName;
        // Normalize for texture packs (lowercase, etc)
        return cleanName.toLowerCase().replace(/ /g, '_');
    };

    return (
        <div className="flex h-full bg-gray-950 p-6 overflow-hidden">
            <div className="flex flex-col w-2/3 pr-6">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                             <Grid className="text-orange-500" /> Diseñador de GUI (Config)
                        </h2>
                        <p className="text-gray-400 text-sm">Configura la lógica del menú y previsualiza items.</p>
                    </div>
                </div>

                <div className="bg-[#c6c6c6] p-4 rounded-lg shadow-xl border-4 border-[#555555] inline-block self-center relative">
                    <div className="text-[#404040] font-bold mb-2 font-pixel px-2 text-lg drop-shadow-sm">{title.replace(/&[0-9a-f]/g, '')}</div>
                    <div className="grid grid-cols-9 gap-1 bg-[#c6c6c6]">
                        {Array.from({ length: 54 }).map((_, i) => {
                            const slotData = getSlotData(i);
                            const isSelected = selectedSlot === i;
                            const textureName = slotData?.item ? getTextureUrl(slotData.item) : null;
                            
                            // URLs to try in order (handled by error fallback)
                            // 1. Item texture
                            const itemUrl = textureName ? `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/${textureName}.png` : '';
                            // 2. Block texture (if item fails)
                            const blockUrl = textureName ? `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/block/${textureName}.png` : '';

                            return (
                                <div 
                                    key={i}
                                    onClick={() => setSelectedSlot(i)}
                                    className={`
                                        w-10 h-10 border-2 
                                        ${isSelected ? 'border-red-500 z-10' : 'border-[#373737] border-r-white border-b-white'} 
                                        bg-[#8b8b8b] hover:bg-[#9b9b9b] cursor-pointer relative
                                        flex items-center justify-center group transition-colors
                                    `}
                                >
                                    {/* Slot Inner Shadow */}
                                    <div className="absolute inset-0 border-t-[#373737] border-l-[#373737] border-2 pointer-events-none opacity-40"></div>
                                    
                                    {slotData?.item && (
                                        <div className="w-8 h-8 z-0 relative flex items-center justify-center">
                                            <img 
                                                src={itemUrl} 
                                                alt=""
                                                className="w-full h-full object-contain image-pixelated"
                                                onError={(e) => {
                                                    const img = e.currentTarget;
                                                    // Try fallback to block texture
                                                    if (blockUrl && img.src !== blockUrl) {
                                                        img.src = blockUrl;
                                                    } else {
                                                        // Fallback failed, hide image and show text placeholder
                                                        img.style.display = 'none';
                                                        img.parentElement!.classList.add('text-placeholder');
                                                    }
                                                }}
                                            />
                                            {/* Text placeholder shown via CSS if image is hidden */}
                                            <div className="hidden text-placeholder absolute inset-0 items-center justify-center text-[8px] font-bold text-gray-700/50">
                                                ?
                                            </div>
                                        </div>
                                    )}
                                    <span className="text-[8px] text-gray-600 absolute top-0.5 left-0.5 font-mono opacity-0 group-hover:opacity-100 bg-white/50 px-0.5 rounded pointer-events-none">{i}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="mt-8 bg-gray-900 p-4 rounded border border-gray-800 font-mono text-xs text-green-400 overflow-auto flex-1 custom-scrollbar whitespace-pre shadow-inner">
                    {generateYaml()}
                </div>
            </div>

            <div className="w-1/3 bg-gray-900 border-l border-gray-800 p-6 flex flex-col h-full shadow-lg z-10">
                 <div className="space-y-4 mb-8">
                     <h3 className="font-bold text-gray-300 border-b border-gray-700 pb-2 flex items-center gap-2">
                         <Package size={16}/> Configuración General
                     </h3>
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
                            <label className="block text-xs uppercase text-gray-500 font-bold mb-1">ItemsAdder Item ID</label>
                            <input 
                                placeholder="minecraft:diamond_sword"
                                value={getSlotData(selectedSlot)?.item || ''}
                                onChange={(e) => updateSlot(selectedSlot, { item: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm font-mono focus:border-blue-500 outline-none"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Usa nombres estándar (minecraft:stone) para ver la preview.</p>
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
            <style>{`
                .text-placeholder.text-placeholder {
                    display: flex !important;
                }
            `}</style>
        </div>
    );
};

export default GuiGenerator;