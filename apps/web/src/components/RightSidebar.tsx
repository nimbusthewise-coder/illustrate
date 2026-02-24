/**
 * RightSidebar - Tabbed sidebar with Layers and Components panels
 */

'use client';

import { useState } from 'react';
import { LayerPanel } from './LayerPanel';
import { ComponentLibrary } from './ComponentLibrary';
import { ComponentDefinitionPanel } from './ComponentDefinitionPanel';

type Tab = 'layers' | 'components' | 'properties';

export function RightSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('layers');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'layers', label: 'Layers' },
    { id: 'components', label: 'Components' },
    { id: 'properties', label: 'Properties' },
  ];

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${
                activeTab === tab.id
                  ? 'bg-background text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'layers' && (
          <div className="h-full overflow-auto p-4">
            <LayerPanel />
          </div>
        )}
        {activeTab === 'components' && (
          <div className="h-full">
            <ComponentLibrary />
          </div>
        )}
        {activeTab === 'properties' && (
          <div className="h-full">
            <ComponentDefinitionPanel />
          </div>
        )}
      </div>
    </div>
  );
}
