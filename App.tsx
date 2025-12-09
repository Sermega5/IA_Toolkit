import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RankGenerator from './components/RankGenerator';
import TextureEditor from './components/TextureEditor';
import ConfigGenerator from './components/ConfigGenerator';
import GuiGenerator from './components/GuiGenerator';
import BackgroundDesigner from './components/BackgroundDesigner';
import WikiAssistant from './components/WikiAssistant';
import { AppTab } from './types';
import { Wifi, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.RANK_GENERATOR);
  const [isWikiOpen, setIsWikiOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.RANK_GENERATOR:
        return <RankGenerator />;
      case AppTab.TEXTURE_EDITOR:
        return <TextureEditor />;
      case AppTab.CONFIG_GENERATOR:
        return <ConfigGenerator />;
      case AppTab.GUI_GENERATOR:
        return <GuiGenerator />;
      case AppTab.BACKGROUND_DESIGNER:
        return <BackgroundDesigner />;
      default:
        return <RankGenerator />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        toggleWiki={() => setIsWikiOpen(!isWikiOpen)}
      />
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-hidden relative">
           {renderContent()}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-900 border-t border-gray-800 p-2 flex justify-between items-center text-[10px] text-gray-500 font-mono z-10 px-4">
            <span>Desarrollado por Sermega, todos los derechos reservados a Sermega</span>
            <div className={`flex items-center gap-2 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                {isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>}
                <span>{isOnline ? 'ONLINE' : 'OFFLINE (Modo Local)'}</span>
            </div>
        </div>

        <WikiAssistant isOpen={isWikiOpen} onClose={() => setIsWikiOpen(false)} />
      </main>
    </div>
  );
};

export default App;