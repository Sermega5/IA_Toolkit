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
        const cleanName = itemName.includes(':') ? itemName.split(':')[1] : itemName;
        return cleanName.toLowerCase().replace(/ /g, '_');
    };

    return (
        <div className="flex h-full bg-gray-950 p-6 overflow-hidden">
            <div className="flex flex-col w-2/3 pr-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <Grid className="text-orange-500" /> Diseñador de GUI (Config)
                    </h2>
                    <p className="text-gray-400 text-sm">Configura la lógica del menú y los items.</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
                    {/* Standard Grid Layout */}
                    <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-xl border border-gray-800">
                         <div className="grid grid-cols-9 gap-1 bg-[#c6c6c6] p-1 border-4 border-[#555555] rounded-sm">
                            {Array.from({ length: 54 }).map((_, i) => {
                                const slotData = getSlotData(i);
                                const isSelected = selectedSlot === i;
                                const textureName = slotData?.item ? getTextureUrl(slotData.item) : null;
                                
                                // Preview Logic
                                const mineatarUrl = textureName ? `https://api.mineatar.io/item/${textureName}` : '';
                                const rawItemUrl = textureName ? `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.3/assets/minecraft/textures/item/${textureName}.png` : '';
                                
                                return (
                                    <div 
                                        key={i}
                                        onClick={() => setSelectedSlot(i)}
                                        className={`
                                            w-10 h-10 sm:w-12 sm:h-12 border-2 
                                            ${isSelected ? 'border-red-500 z-10' : 'border-[#373737] hover:border-white'} 
                                            bg-[#8b8b8b] cursor-pointer relative
                                            flex items-center justify-center group
                                            transition-all
                                        `}
                                    >
                                        <div className="absolute inset-0 border-t-2 border-l-2 border-[#373737] opacity-20 pointer-events-none"></div>
                                        <div className="absolute inset-0 border-b-2 border-r-2 border-[#ffffff] opacity-20 pointer-events-none"></div>
                                        
                                        <span className="absolute top-0.5 left-0.5 text-[8px] text-gray-600 font-mono opacity-0 group-hover:opacity-100">{i}</span>
                                        
                                        {slotData?.item && (
                                            <div className="w-8 h-8 z-10 relative flex items-center justify-center">
                                                <img 
                                                    src={mineatarUrl} 
                                                    alt=""
                                                    className="w-full h-full object-contain image-pixelated"
                                                    onError={(e) => {
                                                        const img = e.currentTarget;
                                                        if (rawItemUrl && img.src !== rawItemUrl) {
                                                            img.src = rawItemUrl;
                                                        } else {
                                                            img.style.display = 'none';
                                                            img.parentElement!.classList.add('text-placeholder');
                                                        }
                                                    }}
                                                />
                                                 <div className="hidden text-placeholder absolute inset-0 items-center justify-center text-[8px] font-bold text-gray-700 break-all text-center leading-none overflow-hidden">
                                                    {textureName?.substring(0, 4)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                         </div>
                    </div>
                </div>
                
                <div className="mt-8 bg-gray-900 p-4 rounded border border-gray-800 font-mono text-xs text-green-400 overflow-auto h-48 custom-scrollbar whitespace-pre shadow-inner">
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
                     <span>Slot Seleccionado: <span className="text-blue-400 font-mono">{selectedSlot !== null ? selectedSlot : '-'}</span></span>
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
                            <p className="text-[10px] text-gray-500 mt-1">Usa nombres en inglés (ej: diamond_sword) para ver la imagen.</p>
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