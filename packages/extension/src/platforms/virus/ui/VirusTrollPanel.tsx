import React from "react";
import { AlertTriangle } from "lucide-react";
import { VIRUS_TROLL_TOOLS } from "~lib/data";
import { useTranslation } from "~i18n";
import { PremiumToolCard } from "~components/common/PremiumToolCard";

interface VirusTrollPanelProps {
  onSelectTool?: (tool: any) => void;
}

export const VirusTrollPanel: React.FC<VirusTrollPanelProps> = ({ onSelectTool }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col min-h-0 bg-[rgb(var(--bg-main))]">
      <div className="py-2">
        {/* Header Note */}
        <div className="px-5 py-4 border-b border-[rgba(var(--border-main),var(--border-opacity))] mb-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={18} />
            <p className="text-xs text-red-200 font-semibold font-inter leading-relaxed">
              Các công cụ này dùng để trêu đùa bạn bè. Hãy sử dụng có trách nhiệm!
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="px-5 py-4 space-y-8">
          {VIRUS_TROLL_TOOLS.map((cat) => (
            <div key={cat.title}>
              <h3 className="text-[10px] font-bold font-inter text-red-500/60 tracking-[0.2em] uppercase mb-5 px-1 flex items-center gap-3">
                <span>{cat.title}</span>
                <div className="h-px flex-1 bg-[rgba(var(--border-main),var(--border-opacity))]" />
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {cat.tools.map((tool) => (
                  <PremiumToolCard 
                    key={tool.name}
                    tool={tool}
                    onClick={() => onSelectTool?.({
                      ...tool,
                      isFullscreen: true,
                      renderContent: () => (
                        <div className="w-full h-full bg-black flex flex-col">
                          <iframe 
                            src={tool.link} 
                            className="w-full h-full border-0"
                            title={tool.name}
                            allow="fullscreen"
                          />
                        </div>
                      )
                    })}
                    compact={true}
                    showToggle={false}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
