import React from "react";
import { useWSKStore } from "~store/wsk-store";
import { TIKTOK_TOOLS } from "~lib/data";
import { useTranslation } from "~i18n";
import { PremiumToolCard } from "~components/common/PremiumToolCard";
import { Download, Play } from "lucide-react";

interface TikTokToolsPanelProps {
  onSelectTool?: (tool: any) => void;
}

export const TikTokToolsPanel: React.FC<TikTokToolsPanelProps> = ({ onSelectTool }) => {
  const { t } = useTranslation();
  const { 
    ttNoWatermark, ttAutoScroll,
    set 
  } = useWSKStore();

  const settingsTools = [
    { id: "ttNoWatermark", i18nKey: "tt_tool_no_wm", label: t("tt_tool_no_wm"), description: t("tt_tool_no_wm_desc"), icon: Download, checked: ttNoWatermark, color: "#25F4EE" },
    { id: "ttAutoScroll", i18nKey: "tt_tool_scroll", label: t("tt_tool_scroll"), description: t("tt_tool_scroll_desc"), icon: Play, checked: ttAutoScroll, color: "#FE2C55" },
  ];

  return (
    <div className="flex flex-col h-full bg-[rgb(var(--bg-main))] overflow-hidden">
      <div className="flex-1 min-h-0 pointer-events-auto">
        <div className="py-2">
          {/* Settings Cards */}
          <div className="px-5 py-4">
            <h3 className="text-[10px] font-bold font-inter text-[rgb(var(--text-muted))] tracking-[0.2em] uppercase mb-5 px-1 flex items-center gap-3">
              <span>{t("quick_settings")}</span>
              <div className="h-px flex-1 bg-[rgba(var(--border-main),var(--border-opacity))]" />
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {settingsTools.map((tool) => (
                <PremiumToolCard 
                  key={tool.id}
                  tool={{
                    name: tool.label,
                    icon: tool.icon,
                    color: tool.color,
                    description: tool.description
                  }}
                  isActive={tool.checked}
                  onClick={() => set(tool.id as any, !tool.checked)}
                  onToggle={(val) => set(tool.id as any, val)}
                  compact={true}
                />
              ))}
            </div>
          </div>

          {/* Tools Grid */}
          <div className="px-5 py-4 space-y-7">
            {TIKTOK_TOOLS.map((cat) => (
              <div key={cat.title}>
                <h3 className="text-[10px] font-bold font-inter text-[rgb(var(--text-muted))] tracking-[0.2em] uppercase mb-5 px-1 flex items-center gap-3">
                  <span>{cat.i18nKey ? t(cat.i18nKey) : cat.title}</span>
                  <div className="h-px flex-1 bg-[rgba(var(--border-main),var(--border-opacity))]" />
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {cat.tools.map((tool) => (
                    <PremiumToolCard 
                      key={tool.name}
                      tool={tool}
                      onClick={() => onSelectTool?.(tool)}
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
    </div>
  );
};
