import React from "react";
import { useWSKStore } from "~store/wsk-store";
import { FACEBOOK_TOOLS } from "~lib/data";
import { useTranslation } from "~i18n";
import { PremiumToolCard } from "~components/common/PremiumToolCard";
import { Shield, MessageCircleX, Type, EyeOff, Layout, Heart, Download, Clock } from "lucide-react";

interface FacebookToolsPanelProps {
  onSelectTool?: (tool: any) => void;
}
export const FacebookToolsPanel: React.FC<FacebookToolsPanelProps> = ({ onSelectTool }) => {
  const { t } = useTranslation();
  const { 
    blockSeenChat, blockSeenStory, blockTyping, blockPixel, showTimer, 
    stopNewFeed, showReactions, fbVideoDownload,
    set 
  } = useWSKStore();

  const settingsTools = [
    { id: "blockPixel", label: t("block_pixel"), description: t("block_pixel_desc"), icon: Shield, checked: blockPixel, color: "#10b981" },
    { id: "blockSeenChat", label: t("block_seen_chat"), description: t("block_seen_chat_desc"), icon: MessageCircleX, checked: blockSeenChat, color: "#ef4444" },
    { id: "blockTyping", label: t("block_typing_chat"), description: t("block_typing_chat_desc"), icon: Type, checked: blockTyping, color: "#3b82f6" },
    { id: "blockSeenStory", label: t("block_seen_story"), description: t("block_seen_story_desc"), icon: EyeOff, checked: blockSeenStory, color: "#f59e0b" },
    { id: "stopNewFeed", label: t("stop_news_feed"), description: t("stop_news_feed_desc"), icon: Layout, checked: stopNewFeed, color: "#8b5cf6" },
    { id: "showReactions", label: t("show_reactions"), description: t("show_reactions_desc"), icon: Heart, checked: showReactions, color: "#ec4899" },
    { id: "fbVideoDownload", label: t("fb_video_download"), description: t("fb_video_download_desc"), icon: Download, checked: fbVideoDownload, color: "#f59e0b" },
    { id: "showTimer", label: t("show_timer"), description: t("show_timer_desc"), icon: Clock, checked: showTimer, color: "#3b82f6" },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[rgb(var(--bg-main))]">
      {/* Phần cuộn chính */}
      <div 
        className="flex-1 min-h-0 pointer-events-auto"
      >
        <div className="py-2">

          {/* Quick Settings */}
          <div className="px-5 py-2">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-[0.2em]">{t("quick_settings")}</h3>
            </div>
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
            {FACEBOOK_TOOLS.map((cat) => (
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