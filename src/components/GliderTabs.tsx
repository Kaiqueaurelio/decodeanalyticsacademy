import { useRef, useEffect, useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface GliderTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function GliderTabs({ tabs, activeTab, onTabChange, className = '' }: GliderTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gliderStyle, setGliderStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
    if (activeEl) {
      setGliderStyle({
        width: activeEl.offsetWidth,
        left: activeEl.offsetLeft,
      });
      // Auto-scroll para que a aba ativa fique visível em mobile
      try {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      } catch {
        // ignora em browsers antigos
      }
    }
  }, [activeTab, tabs]);

  return (
    <div ref={containerRef} className={`glider-tabs ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          data-tab-id={tab.id}
          className={`glider-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className="tab-badge">{tab.count}</span>
          )}
        </button>
      ))}
      <div className="glider" style={gliderStyle} />
    </div>
  );
}
