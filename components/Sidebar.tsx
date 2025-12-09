import React from 'react';
import { LayoutDashboard, Paintbrush, FileJson, Sword, Grid, Layout, Bot } from 'lucide-react';
import { AppTab } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  toggleWiki: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, toggleWiki }) => {
  const navItems = [
    { id: AppTab.RANK_GENERATOR, label: 'Generador de Rangos', icon: LayoutDashboard },
    { id: AppTab.TEXTURE_EDITOR, label: 'Editor de Texturas IA', icon: Paintbrush },
    { id: AppTab.CONFIG_GENERATOR, label: 'Configuración de Items', icon: FileJson },
    { id: AppTab.GUI_GENERATOR, label: 'Configurador GUI', icon: Grid },
    { id: AppTab.BACKGROUND_DESIGNER, label: 'Diseñador de Fondo', icon: Layout },
  ];

  return (
    <div className="w-64 bg-gray-900 h-screen border-r border-gray-800 flex flex-col z-20 relative shadow-xl">
      <div className="p-6 flex items-center space-x-3 border-b border-gray-800">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Sword className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-white tracking-tight leading-none">IA Toolkit</h1>
          <span className="text-xs text-gray-500">ItemsAdder Tools</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {/* Chatbot Button */}
        <button
          onClick={toggleWiki}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left mb-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-blue-800/30 hover:border-blue-500 text-blue-200 group"
        >
          <Bot size={20} className="text-blue-400 group-hover:animate-bounce" />
          <span className="font-bold text-sm">Asistente IA</span>
        </button>

        <div className="h-px bg-gray-800 my-2 mx-2"></div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Estado</p>
          <div className="flex items-center space-x-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-sm text-gray-300">Sistema Listo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;