import React from "react";
import { useWSKStore } from "~store/wsk-store";
import { THREADS_TOOLS } from "~lib/data";
import { useTranslation } from "~i18n";
import { PremiumToolCard } from "~components/common/PremiumToolCard";
import { EyeOff, Layout } from "lucide-react";

interface ThreadsToolsPanelProps {
  onSelectTool?: (tool: any) => void;
}

export const ThreadsToolsPanel: React.FC<ThreadsToolsPanelProps> = ({ onSelectTool }) => {
  const { t } = useTranslation();
  const { 
    threadsBlockSeen, threadsHidePosts,
    set 
  } = useWSKStore();

  const settingsTools = [
    { id: "threadsBlockSeen", i18nKey: "th_tool_block_seen", label: t("th_tool_block_seen"), description: t("th_tool_block_seen_desc"), icon: EyeOff, checked: threadsBlockSeen, color: "#ffffff" },
    { id: "threadsHidePosts", i18nKey: "th_tool_hide_posts", label: t("th_tool_hide_posts"), description: t("th_tool_hide_posts_desc"), icon: Layout, checked: threadsHidePosts, color: "#f8fafc" },
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
            {THREADS_TOOLS.map((cat) => (
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
