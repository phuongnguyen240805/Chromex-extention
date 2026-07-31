import React, { useState } from 'react';
import { SecurityTab } from './tabs/SecurityTab';
import { BulkTab } from './tabs/BulkTab';
import { DownloaderTab } from './tabs/DownloaderTab';
import { AutomationTab } from './tabs/AutomationTab';

type Tab = 'security' | 'bulk' | 'downloader' | 'automation';

export const MetaToolsSidePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('security');

  const renderTab = () => {
    switch (activeTab) {
      case 'security': return <SecurityTab />;
      case 'bulk': return <BulkTab />;
      case 'downloader': return <DownloaderTab />;
      case 'automation': return <AutomationTab />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      <header className="p-4 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-lg font-semibold font-inter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Meta Tools
        </h1>
      </header>
      
      <nav className="flex border-b border-white/5 bg-white/5">
        {(['security', 'bulk', 'downloader', 'automation'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-semibold font-inter uppercase tracking-wider transition-colors ${
              activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-4">
        {renderTab()}
      </main>
    </div>
  );
};

export default MetaToolsSidePanel;
