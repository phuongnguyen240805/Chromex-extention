import React from "react";
import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "~i18n";

interface PremiumToolCardProps {
  tool: {
    name: string;
    icon: React.ComponentType<any>;
    color?: string;
    i18nKey?: string;
    shortcut?: string;
    description?: string;
    statusLabel?: string;
    disabled?: boolean;
    ladipageAppId?: string;
  };
  onClick: () => void;
  onToggle?: (val: boolean) => void;
  isActive?: boolean;
  compact?: boolean;
  showToggle?: boolean;
}

export const PremiumToolCard: React.FC<PremiumToolCardProps> = ({ 
  tool, 
  onClick, 
  onToggle,
  isActive = false,
  compact = false,
  showToggle = true
}) => {
  const { t } = useTranslation();

  const handleToggle = (e: React.MouseEvent) => {
    if (onToggle) {
      e.stopPropagation();
      onToggle(!isActive);
    }
  };

  const isDisabled = tool.disabled === true;
  const isFacebookAdsApp = tool.ladipageAppId === "10";

  return (
    <div 
      onClick={isDisabled ? undefined : onClick}
      aria-disabled={isDisabled}
      className={`group relative overflow-hidden bg-[rgb(var(--bg-card))] border border-[rgba(var(--border-main),var(--border-opacity))] rounded-3xl transition-all flex flex-col gap-4 ${
        isDisabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-[rgb(var(--bg-card-hover))] hover:border-blue-500/30 hover:shadow-2xl active:scale-[0.98]"
      } ${
        isActive ? "ring-2 ring-blue-500/50 bg-[rgb(var(--bg-card-hover))] shadow-[0_0_20px_rgba(59,130,246,0.15)]" : ""
      } ${
        isFacebookAdsApp
          ? "border-blue-500/35 bg-gradient-to-br from-blue-500/15 via-[rgb(var(--bg-card))] to-indigo-500/10 hover:border-blue-400/60 hover:shadow-[0_22px_60px_rgba(37,99,235,0.18)]"
          : ""
      } ${compact ? "p-4 gap-3" : "p-5 gap-4"}`}
    >
      {isFacebookAdsApp && (
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-500/15 blur-2xl" />
      )}
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center transition-all group-hover:scale-110 ${
            isFacebookAdsApp
              ? "h-10 w-10 rounded-2xl bg-gradient-to-br from-[#2c49f1] to-[#1877f2] shadow-lg shadow-blue-500/25"
              : ""
          }`}>
            <tool.icon 
              size={compact ? 24 : 28} 
              style={{ color: isFacebookAdsApp ? "#ffffff" : tool.color || '#8b949e' }} 
            />
          </div>
          <div className="flex flex-col">
            <span className={`${compact ? "text-xs" : "text-sm"} font-bold text-[rgb(var(--text-main))]`}>
              {tool.i18nKey ? t(tool.i18nKey) : tool.name}
            </span>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-wider">
              {tool.statusLabel || "v0.4.12"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {!compact && (
            <div className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <MoreHorizontal size={16} className="text-gray-500" />
            </div>
          )}
          {showToggle && (
            <div 
              onClick={handleToggle}
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${isActive ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'left-6' : 'left-1'}`} />
            </div>
          )}
        </div>
      </div>

      {/* Card Body (Explanation of how tool works) */}
      <div className="flex-1">
        <p className={`text-[11px] leading-relaxed text-[rgb(var(--text-muted))] font-medium ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
          {tool.description || t(`${tool.i18nKey || tool.name.toLowerCase().replace(/\s+/g, '_')}_desc`) || "Giải thích cách công cụ này hoạt động để giúp bạn tối ưu hóa quy trình làm việc trên mạng xã hội."}
        </p>
        {isFacebookAdsApp && (
          <div className="relative mt-3 flex flex-wrap gap-1.5">
            {["AD", "BM", "PAGE", "CAMP"].map((module) => (
              <span
                key={module}
                className="rounded-lg border border-blue-400/20 bg-blue-500/10 px-2 py-1 text-[9px] font-extrabold text-blue-400"
              >
                {module}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer */}
      {!compact && (
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 font-medium">
            {isFacebookAdsApp ? "Đồng bộ từ Ladipage FE" : "Updated: Just now"}
          </span>
          {tool.shortcut && (
            <span className="text-[9px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-lg">
              {tool.shortcut}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
