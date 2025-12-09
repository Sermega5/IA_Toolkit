import React, { useState, useEffect } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Zap, Shield, Plus, Trash2 } from 'lucide-react';
import { ItemConfig } from '../types';

const ConfigGenerator: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('general');
  const [config, setConfig] = useState<ItemConfig>({
    namespace: 'mis_items',
    id: 'espada_rubi',
    displayName: '&cEspada de Rubí',
    material: 'DIAMOND_SWORD',
    modelId: 10001,
    lore: '&7Una espada forjada con rubíes puros.\n&7Muy afilada.',
    path: 'item/ruby_sword',
    events: [],
    specifics: []
  });

  const [yamlOutput, setYamlOutput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loreLines = config.lore.split('\n').map(l => `      - '${l}'`).join('\n');
    
    let eventsYaml = '';
    if (config.events.length > 0) {
        eventsYaml = `    events:\n`;
        config.events.forEach(evt => {
            eventsYaml += `      ${evt.type}:\n        commands:\n`;
            evt.actions.forEach(action => {
                eventsYaml += `          - '${action}'\n`;
            });
        });
    }

    let specificYaml = '';
    if (config.specifics.length > 0) {
        specificYaml = `    specific_properties:\n`;
        config.specifics.forEach(spec => {
             specificYaml += `      ${spec.key}: ${spec.value}\n`;
        });
    }

    const yaml = `info:
  namespace: ${config.namespace}
items:
  ${config.id}:
    display_name: '${config.displayName}'
    permission: ${config.namespace}.${config.id}
    resource:
      material: ${config.material}
      generate: false
      model_path: ${config.path}
      model_id: ${config.modelId}
    lore:
${loreLines}
    attributes:
      attack_damage: 7
      attack_speed: 1.6
${eventsYaml}
${specificYaml}`;

    setYamlOutput(yaml);
  }, [config]);

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (sec: string) => {
      setActiveSection(activeSection === sec ? '' : sec);
  }

  const addEvent = () => {
      setConfig({
          ...config,
          events: [...config.events, { type: 'interact', actions: ['sound: block.note_block.pling'] }]
      });
  };

  const updateEvent = (index: number, field: 'type' | 'actions', value: string) => {
      const newEvents = [...config.events];
      if (field === 'actions') {
          newEvents[index].actions = [value]; // Simple single line for now
      } else {
          newEvents[index].type = value;
      }
      setConfig({ ...config, events: newEvents });
  };

  const removeEvent = (index: number) => {
      setConfig({ ...config, events: config.events.filter((_, i) => i !== index) });
  };
  
  const addSpecific = () => {
      setConfig({
          ...config,
          specifics: [...config.specifics, { key: 'block', value: 'example_block' }]
      });
  };

  const updateSpecific = (index: number, field: 'key' | 'value', value: string) => {
      const newSpecs = [...config.specifics];
      newSpecs[index][field] = value;
      setConfig({ ...config, specifics: newSpecs });
  };
  
  const removeSpecific = (index: number) => {
      setConfig({ ...config, specifics: config.specifics.filter((_, i) => i !== index) });
  };

  return (
    <div className="flex h-full bg-gray-950 text-gray-200">
      {/* Form Side */}
      <div className="w-1/2 overflow-y-auto border-r border-gray-800 custom-scrollbar">
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center gap-2">
                <FileJsonIcon /> Configuración ItemsAdder
            </h2>
            
            <div className="space-y-4">
                {/* General Section */}
                <div className="border border-gray-800 rounded-lg overflow-hidden">
                    <button onClick={() => toggleSection('general')} className="w-full flex items-center justify-between p-4 bg-gray-900 hover:bg-gray-800 transition-colors">
                        <span className="font-bold text-gray-300">Información General</span>
                        {activeSection === 'general' ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                    </button>
                    {activeSection === 'general' && (
                        <div className="p-4 bg-gray-900/50 space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Namespace</label>
                                <input 
                                    type="text" 
                                    value={config.namespace}
                                    onChange={e => setConfig({...config, namespace: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 focus:border-green-500 outline-none"
                                />
                                </div>
                                <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">ID del Item</label>
                                <input 
                                    type="text" 
                                    value={config.id}
                                    onChange={e => setConfig({...config, id: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 focus:border-green-500 outline-none"
                                />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Nombre Visible</label>
                                <input 
                                    type="text" 
                                    value={config.displayName}
                                    onChange={e => setConfig({...config, displayName: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 focus:border-green-500 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Lore (Descripción)</label>
                                <textarea 
                                    value={config.lore}
                                    onChange={e => setConfig({...config, lore: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 focus:border-green-500 outline-none h-24 font-mono text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Resource Section */}
                <div className="border border-gray-800 rounded-lg overflow-hidden">
                    <button onClick={() => toggleSection('resource')} className="w-full flex items-center justify-between p-4 bg-gray-900 hover:bg-gray-800 transition-colors">
                        <span className="font-bold text-gray-300">Recursos y Modelo</span>
                        {activeSection === 'resource' ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                    </button>
                    {activeSection === 'resource' && (
                        <div className="p-4 bg-gray-900/50 space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Material Base</label>
                                <select 
                                    value={config.material}
                                    onChange={e => setConfig({...config, material: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 focus:border-green-500 outline-none"
                                >
                                    <option value="DIAMOND_SWORD">DIAMOND_SWORD</option>
                                    <option value="PAPER">PAPER</option>
                                    <option value="LEATHER_HELMET">LEATHER_HELMET</option>
                                    <option value="BOW">BOW</option>
                                </select>
                                </div>
                                <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Custom Model ID</label>
                                <input 
                                    type="number" 
                                    value={config.modelId}
                                    onChange={e => setConfig({...config, modelId: parseInt(e.target.value)})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 focus:border-green-500 outline-none"
                                />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Ruta del Modelo</label>
                                <input 
                                    type="text" 
                                    value={config.path}
                                    onChange={e => setConfig({...config, path: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 focus:border-green-500 outline-none font-mono text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Events Section */}
                <div className="border border-gray-800 rounded-lg overflow-hidden">
                    <button onClick={() => toggleSection('events')} className="w-full flex items-center justify-between p-4 bg-gray-900 hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-2">
                             <Zap size={16} className="text-yellow-500"/>
                             <span className="font-bold text-gray-300">Eventos</span>
                        </div>
                        {activeSection === 'events' ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                    </button>
                    {activeSection === 'events' && (
                        <div className="p-4 bg-gray-900/50 space-y-4">
                            {config.events.map((evt, idx) => (
                                <div key={idx} className="flex gap-2 items-start mb-2">
                                    <div className="flex-1 space-y-2">
                                        <input 
                                            placeholder="Evento (ej: interact)" 
                                            value={evt.type}
                                            onChange={(e) => updateEvent(idx, 'type', e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
                                        />
                                        <input 
                                            placeholder="Comando (ej: sound: entity.player.levelup)" 
                                            value={evt.actions[0]}
                                            onChange={(e) => updateEvent(idx, 'actions', e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono"
                                        />
                                    </div>
                                    <button onClick={() => removeEvent(idx)} className="text-red-500 hover:bg-red-900/20 p-1 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addEvent} className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 mt-2">
                                <Plus size={14} /> Añadir Evento
                            </button>
                        </div>
                    )}
                </div>
                
                 {/* Specific Properties */}
                 <div className="border border-gray-800 rounded-lg overflow-hidden">
                    <button onClick={() => toggleSection('specifics')} className="w-full flex items-center justify-between p-4 bg-gray-900 hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-2">
                             <Shield size={16} className="text-blue-500"/>
                             <span className="font-bold text-gray-300">Propiedades Específicas</span>
                        </div>
                        {activeSection === 'specifics' ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                    </button>
                    {activeSection === 'specifics' && (
                        <div className="p-4 bg-gray-900/50 space-y-4">
                             {config.specifics.map((spec, idx) => (
                                <div key={idx} className="flex gap-2 items-center mb-2">
                                    <input 
                                        placeholder="Propiedad (ej: armor)" 
                                        value={spec.key}
                                        onChange={(e) => updateSpecific(idx, 'key', e.target.value)}
                                        className="w-1/3 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
                                    />
                                    <span className="text-gray-500">:</span>
                                    <input 
                                        placeholder="Valor (ej: HEAD)" 
                                        value={spec.value}
                                        onChange={(e) => updateSpecific(idx, 'value', e.target.value)}
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono"
                                    />
                                    <button onClick={() => removeSpecific(idx)} className="text-red-500 hover:bg-red-900/20 p-1 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                             <button onClick={addSpecific} className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 mt-2">
                                <Plus size={14} /> Añadir Propiedad
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
      </div>

      {/* Code Preview Side */}
      <div className="w-1/2 p-8 bg-[#1e1e1e] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-400 font-mono text-sm">config.yml</h3>
          <button 
            onClick={handleCopy}
            className="flex items-center space-x-2 text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-colors"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado' : 'Copiar YAML'}</span>
          </button>
        </div>
        
        <div className="flex-1 relative overflow-hidden rounded-lg border border-gray-700 shadow-inner bg-[#141414]">
          <pre className="absolute inset-0 p-4 text-green-300 font-mono text-sm overflow-auto leading-relaxed custom-scrollbar">
            {yamlOutput}
          </pre>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-900/50 rounded text-yellow-500 text-xs">
          <strong>Tip:</strong> ItemsAdder es estricto con la indentación. Este generador sigue el formato de la wiki oficial.
        </div>
      </div>
    </div>
  );
};

const FileJsonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1"/><path d="M14 13a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1"/></svg>
)

export default ConfigGenerator;