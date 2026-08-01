import React, { useState } from "react";
import { 
  X, Search, Edit3, Heart, Link, Clipboard, FileText, Grid, Settings, 
  MoreHorizontal, MousePointer2, Code, Layout, Palette, Monitor, 
  ShieldCheck, PieChart, Download, Users, Video, MessageCircle, Crown, Sparkles,
  PanelRightOpen
} from "lucide-react";

import { useWSKStore } from "../../store/wsk-store";
import { useFocusRestore } from "../../hooks/useFocusRestore";
import { PremiumPanel } from "./PremiumPanel";
import { useTranslation } from "~i18n";
import { PremiumToolCard } from "~components/common/PremiumToolCard";
import {
  LADIPAGE_APP_CATEGORIES,
  LADIPAGE_APPS,
} from "~mini-apps/ladipage/app-catalog";

// Định nghĩa type rõ ràng để tránh lỗi
export type Tool = {
  name: string;
  icon: React.ComponentType<any>;
  shortcut?: string;
  color?: string;
  i18nKey?: string;
  description?: string;
  ladipageAppId?: string;
  statusLabel?: string;
  disabled?: boolean;
};

const CATEGORIES: { title: string; i18nKey?: string; tools: Tool[] }[] = [
{ 
  title: 'SOCIAL MEDIA', 
  i18nKey: 'social_media_category',
  tools: [
    { 
      name: 'Facebook Tools', 
      i18nKey: 'facebook_tools',
      icon: Users, 
      shortcut: 'Alt+F',
      color: '#1877F2'
    },
    { 
      name: 'TikTok Tools', 
      i18nKey: 'tiktok_tools',
      icon: Video,     
      shortcut: 'Alt+T',
      color: '#EE1D52'    
    },
    { 
      name: 'Threads Tools', 
      i18nKey: 'threads_tools',
      icon: MessageCircle, 
      shortcut: 'Alt+H',
      color: '#000000'
    },
    { 
      name: 'Instagram Tools', 
      i18nKey: 'instagram_tools',
      icon: Users, 
      shortcut: 'Alt+I',
      color: '#E1306C'
    },
    { 
      name: 'Cross Platform', 
      i18nKey: 'cross_platform',
      icon: Link 
    },
    { 
      name: 'Keywords Everywhere', 
      i18nKey: 'keywords_everywhere',
      icon: Search,
      shortcut: 'Alt+K',
      color: '#0EA5E9',
      description: 'SEO keyword research, search volume, CPC, competition data and trend analysis across multiple platforms.'
    }
  ] 
},
  { 
    title: 'CODE', 
    i18nKey: 'code_category',
    tools: [
      { name: 'Inspector', i18nKey: 'inspector', icon: MousePointer2, shortcut: 'Alt+I' },
      { name: 'Analyzer', i18nKey: 'analyzer', icon: Search, shortcut: 'Alt+A' },
      { name: 'Mover', i18nKey: 'mover', icon: Layout, shortcut: 'Alt+M' },
      { name: 'Visual Editor', i18nKey: 'visual_editor', icon: Edit3 },
      { name: 'Image Element', i18nKey: 'image_element', icon: Palette }
    ] 
  },
  { 
    title: 'WEBSITE', 
    i18nKey: 'website_category',
    tools: [
      { name: 'Meta Viewer', i18nKey: 'meta_viewer', icon: Monitor },
      { name: 'Link Extractor', i18nKey: 'link_extractor', icon: Link },
      { name: 'Media Extractor', i18nKey: 'media_extractor', icon: Download },
      { name: 'Open Graph', i18nKey: 'open_graph', icon: ShieldCheck },
      { name: 'Site Stack', i18nKey: 'site_stack', icon: PieChart }
    ] 
  },
  {
    title: 'SECURITY & PRIVACY',
    i18nKey: 'security_privacy_category',
    tools: [
      {   
        name: 'Bảo vệ lừa đảo', 
        i18nKey: 'anti_phishing',
        icon: ShieldCheck, 
        color: '#10b981',
        shortcut: 'Global'
      }
    ]
  }
];

CATEGORIES.push(
  ...LADIPAGE_APP_CATEGORIES.map((category) => ({
    title: category.title,
    tools: LADIPAGE_APPS.filter((app) => app.category === category.id).map(
      (app) => ({
        name: app.toolName,
        icon: app.icon,
        color: app.color,
        description: app.description,
        ladipageAppId: app.id,
        statusLabel:
          app.statusLabel ||
          (app.embedMode === "upcoming"
            ? "Sắp ra mắt"
            : app.embedMode === "partial"
              ? "Nhúng một phần"
              : "Ứng dụng Ladipage"),
        disabled: app.embedMode === "upcoming",
      }),
    ),
  })),
);

export const MegaMenuPanel = ({ 
  onClose, 
  onSelectTool 
}: { 
  onClose: () => void,
  onSelectTool: (tool: Tool) => void
}) => {
  const { t } = useTranslation();
  const { antiPhishing, set } = useWSKStore();
  const [showPremium, setShowPremium] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { saveFocus, restoreFocus } = useFocusRestore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveFocus();
    setSearchTerm(e.target.value);
    setTimeout(restoreFocus, 0);
  };

  const handleMegaClose = () => {
    onClose();
  };

  // Lọc theo search
  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    tools: cat.tools.filter(tool =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tool.i18nKey && t(tool.i18nKey).toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(cat => cat.tools.length > 0);

  return (
    <>
      <div 
        className="relative bg-[rgb(var(--bg-main))] w-full max-w-5xl rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden border border-[rgba(var(--border-main),var(--border-opacity))] animate-in zoom-in-95 duration-300 pointer-events-auto flex flex-col"
        style={{ height: '90vh', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[rgba(var(--border-main),var(--border-opacity))] bg-[rgba(var(--bg-main),0.8)] backdrop-blur-xl flex items-center gap-6 z-1000">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-[rgb(var(--bg-card))] border border-[rgba(var(--border-main),var(--border-opacity))] text-[rgb(var(--text-main))] font-semibold font-inter pl-11 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm placeholder:text-[rgb(var(--text-muted))]"
            />
          </div>

          <button 
            onClick={() => setShowPremium(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-bold font-inter hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 transition-all active:scale-95 group"
          >
            <Crown size={18} className="group-hover:rotate-12 transition-transform" />
            <span>{t("go_premium")}</span>
          </button>

          <div className="flex items-center gap-4">
            <button className="p-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-main))] hover:bg-[rgb(var(--bg-card))] rounded-2xl transition-all">
              <Heart size={20} />
            </button>
            <button className="p-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-main))] hover:bg-[rgb(var(--bg-card))] rounded-2xl transition-all">
              <Edit3 size={20} />
            </button>
            <div className="w-px h-8 bg-[rgba(var(--border-main),var(--border-opacity))] mx-2" />
            <button 
              onClick={() => {
                console.log("MegaMenu: Sending open-side-panel command");
                chrome.runtime.sendMessage({ cmd: "open-side-panel" }, (res) => {
                  console.log("MegaMenu: Received response", res);
                });
              }}
              title="Open Chromex AI"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl text-xs font-bold font-inter hover:shadow-[0_0_16px_rgba(16,185,129,0.3)] hover:scale-105 transition-all active:scale-95 group"
            >
              <PanelRightOpen size={16} className="group-hover:translate-x-0.5 transition-transform" />
              <span>Chromex AI</span>
            </button>
            <button 
              onClick={handleMegaClose} 
              className="p-3 text-[rgb(var(--text-muted))] hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[rgb(var(--bg-main))]" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {filteredCategories.map(cat => (
            <div key={cat.title} className="mb-12 last:mb-0">
              <h3 className="text-[10px] font-bold font-inter text-[rgb(var(--text-muted))] tracking-[0.2em] uppercase mb-6 px-1 flex items-center gap-3">
                <span>{cat.i18nKey ? t(cat.i18nKey) || cat.title : cat.title}</span>
                <div className="h-px flex-1 bg-[rgba(var(--border-main),var(--border-opacity))]" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cat.tools.map(tool => {
                  const isAntiPhishing = tool.i18nKey === 'anti_phishing';
                  const isActive = isAntiPhishing && antiPhishing;

                  return (
                    <PremiumToolCard 
                      key={tool.name}
                      tool={tool}
                      onClick={() => {
                        if (tool.disabled) {
                          return;
                        }
                        if (isAntiPhishing) {
                          set("antiPhishing", !antiPhishing);
                        } else {
                          onSelectTool(tool);
                        }
                      }}
                      onToggle={isAntiPhishing ? (val) => set("antiPhishing", val) : undefined}
                      isActive={isActive}
                      showToggle={isAntiPhishing}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {/* Premium Overlay */}
        {showPremium && (
          <PremiumPanel onClose={() => setShowPremium(false)} />
        )}
      </div>
    </>
  );
};
