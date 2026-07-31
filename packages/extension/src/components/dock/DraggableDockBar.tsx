import React, { useState, useRef, useEffect } from "react";
import { 
  Grid, Settings, GripVertical, Users, Hash, Sun, Moon, Search, PanelRightOpen 
} from "lucide-react";
import { FaInstagramSquare } from "react-icons/fa";
import { AiFillTikTok, AiFillBug } from "react-icons/ai";
import { FaSquareThreads } from "react-icons/fa6";
import { useWSKStore } from "~store/wsk-store";
import { MegaMenuPanel } from "./MegaMenuPanel";
import { ToolDetailPanel } from "./ToolDetailPanel";
import { FacebookToolsPanel } from "~platforms/facebook/ui/FacebookToolsPanel";
import { InstagramToolsPanel } from "~platforms/instagram/ui/InstagramToolsPanel";
import { TikTokToolsPanel } from "~platforms/tiktok/ui/TikTokToolsPanel";
import { ThreadsToolsPanel } from "~platforms/threads/ui/ThreadsToolsPanel";
import { VirusTrollPanel } from "~platforms/virus/ui/VirusTrollPanel";
import { KeywordToolsPanel } from "~platforms/keyword-tools/src/ui/KeywordToolsPanel";
import {
  FACEBOOK_ADS_PANEL_SIZE,
  FacebookAdsEmbeddedPanel,
} from "~mini-apps/facebook-ads/native-ui/FacebookAdsEmbeddedPanel";
import {
  getLadipageAppById,
  LADIPAGE_APP_PANEL_SIZE,
} from "~mini-apps/ladipage/app-catalog";
import { LadipageEmbeddedPanel } from "~mini-apps/ladipage/LadipageEmbeddedPanel";

export const DraggableDockBar = () => {
  const { dockVisible, dockX, dockY, theme, set } = useWSKStore();
  const [isDragging, setIsDragging] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showFakeSidePanel, setShowFakeSidePanel] = useState(false);
  const [activeTools, setActiveTools] = useState<any[]>([]);
  const dockRef = useRef<HTMLDivElement>(null);
  const dockPosRef = useRef({ x: dockX, y: dockY });

  const openTool = (tool: any) => {
    setActiveTools(prev => {
      if (prev.find(t => t.name === tool.name)) return prev;
      return [...prev, tool];
    });
  };

  const closeTool = (toolName: string) => {
    setActiveTools(prev => prev.filter(t => t.name !== toolName));
  };

  const isDraggingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest("button")) return;
    
    const currentTarget = e.currentTarget as HTMLElement;
    currentTarget.setPointerCapture(e.pointerId);

    const startX = e.clientX - dockPosRef.current.x;
    const startY = e.clientY - dockPosRef.current.y;
    let moved = false;

    const onPointerMove = (ev: PointerEvent) => {
      const newX = ev.clientX - startX;
      const newY = ev.clientY - startY;

      if (Math.abs(ev.clientX - (startX + dockPosRef.current.x)) > 5 || 
          Math.abs(ev.clientY - (startY + dockPosRef.current.y)) > 5) {
        moved = true;
        setIsDragging(true);
        isDraggingRef.current = true;
      }

      if (moved) {
        dockPosRef.current = { x: newX, y: newY };
        if (dockRef.current) {
          dockRef.current.style.transform = `translateX(-50%) translate(${newX}px, ${newY}px)`;
        }
      }
    };

    const onPointerUp = (ev: PointerEvent) => {
      currentTarget.releasePointerCapture(e.pointerId);
      if (moved) {
        set("dockX", dockPosRef.current.x);
        set("dockY", dockPosRef.current.y);
        setTimeout(() => {
          setIsDragging(false);
          isDraggingRef.current = false;
        }, 100);
      } else {
        setIsDragging(false);
        isDraggingRef.current = false;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  useEffect(() => {
    dockPosRef.current = { x: dockX, y: dockY };
    if (dockRef.current) {
      dockRef.current.style.transform = `translateX(-50%) translate(${dockX}px, ${dockY}px)`;
    }
  }, [dockX, dockY]);

  const stopDrag = (e: React.PointerEvent) => e.stopPropagation();

  if (!dockVisible) return null;

  return (
    <div className={theme === "light" ? "light" : "dark"}>
      {/* Tool Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-transparent pointer-events-none">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" 
            onClick={() => setShowPanel(false)} 
          />
          <div className="pointer-events-auto z-[10001]">
            <MegaMenuPanel 
              onClose={() => setShowPanel(false)} 
              onSelectTool={(tool) => {
                if (tool.ladipageAppId) {
                  const app = getLadipageAppById(tool.ladipageAppId);
                  if (!app || app.embedMode === "upcoming") {
                    return;
                  }

                  const isFacebookAds = app.id === "10";
                  openTool({
                    ...tool,
                    renderContent: isFacebookAds
                      ? () => <FacebookAdsEmbeddedPanel />
                      : () => <LadipageEmbeddedPanel app={app} />,
                    panelSize: isFacebookAds
                      ? FACEBOOK_ADS_PANEL_SIZE
                      : LADIPAGE_APP_PANEL_SIZE,
                    contentMode: "fill",
                  });
                  return;
                }

                // Map tool names to their panel renderContent
                const panelMap: Partial<Record<string, () => React.ReactNode>> = {
                  "Facebook Tools": () => <FacebookToolsPanel onSelectTool={openTool} />,
                  "TikTok Tools": () => <TikTokToolsPanel onSelectTool={openTool} />,
                  "Instagram Tools": () => <InstagramToolsPanel onSelectTool={openTool} />,
                  "Threads Tools": () => <ThreadsToolsPanel onSelectTool={openTool} />,
                  "Virus Troll": () => <VirusTrollPanel onSelectTool={openTool} />,
                  "Keywords Everywhere": () => <KeywordToolsPanel onSelectTool={openTool} />,
                };
                const renderContent = panelMap[tool.name];
                const selectedTool = renderContent ? { ...tool, renderContent } : tool;
                openTool(selectedTool);
              }}
            />
          </div>
        </div>
      )}

      {/* Multi-Tool Support */}
      {activeTools.map((tool) => (
        <ToolDetailPanel 
          key={tool.name}
          tool={tool} 
          onClose={() => closeTool(tool.name)} 
        />
      ))}

      {/* Fake Side Panel (Iframe) */}
      <div 
        className={`fixed top-0 right-0 h-screen bg-[rgb(var(--bg-main))] border-l border-[rgba(var(--border-main),var(--border-opacity))] shadow-[-10px_0_30px_rgba(0,0,0,0.2)] z-[10002] transition-transform duration-300 ease-in-out ${showFakeSidePanel ? "translate-x-0" : "translate-x-full"}`}
        style={{ width: "400px" }}
      >
        <div className="w-full h-full flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-[rgba(var(--border-main),var(--border-opacity))]">
            <span className="font-semibold text-[rgb(var(--text-main))]">Chromex AI</span>
            <button 
              onClick={() => setShowFakeSidePanel(false)}
              className="p-1 rounded-lg hover:bg-[rgba(var(--bg-card-hover))] text-[rgb(var(--text-muted))] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <iframe 
            src={chrome.runtime.getURL("sidepanel.html")} 
            className="w-full flex-1 border-none bg-transparent"
            title="Chromex AI"
            allow="microphone; clipboard-read; clipboard-write; display-capture"
          />
        </div>
      </div>

      {/* ==================== DOCK BAR ==================== */}
      <div
        ref={dockRef}
        onPointerDown={handlePointerDown}
        className={`
          fixed bottom-6 left-1/2 z-[9999] flex items-center gap-1 
          bg-[rgba(var(--bg-main),0.9)] backdrop-blur-2xl 
          text-[rgb(var(--text-main))] px-3 py-2 
          rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[rgba(var(--border-main),var(--border-opacity))] 
          cursor-grab active:cursor-grabbing pointer-events-auto
          ${isDragging 
            ? "scale-105 shadow-indigo-500/20 ring-2 ring-indigo-500/40 !transition-none" 
            : "transition-all duration-300 hover:shadow-indigo-500/10"
          }
        `}
        style={{ 
          transform: `translateX(-50%) translate(${dockPosRef.current.x}px, ${dockPosRef.current.y}px)`,
          touchAction: isDragging ? "none" : "auto" // Chỉ chặn cuộn khi ĐANG KÉO
        }}
      >
        <button
          onPointerDown={stopDrag}
          onClick={() => {
            const platformIcons: Record<string, any> = {
              "Facebook Tools": Users,
              "TikTok Tools": AiFillTikTok,
              "Threads Tools": FaSquareThreads,
              "Instagram Tools": FaInstagramSquare,
              "Virus Troll": AiFillBug
            };
            const toolName = "Facebook Tools";
            openTool({
                name: toolName,
                icon: platformIcons[toolName] || Grid,
                renderContent: () => <FacebookToolsPanel onSelectTool={openTool} />
            });
          }}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[rgb(var(--bg-card))] active:scale-95 transition-all group"
        >
          <span className="text-[#1877F2] text-2xl font-bold font-inter group-hover:scale-110 transition-transform leading-none">f</span>
        </button>

        <button
          onPointerDown={stopDrag}
          onClick={() => {
            const toolName = "TikTok Tools";
            openTool({
                name: toolName,
                icon: AiFillTikTok,
                renderContent: () => <TikTokToolsPanel onSelectTool={openTool} />
            });
          }}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[rgb(var(--bg-card))] active:scale-95 transition-all group"
        >
          <AiFillTikTok className={`text-2xl group-hover:scale-110 transition-transform ${theme === 'light' ? 'text-black' : 'text-white'}`} />
        </button>

        <button
          onPointerDown={stopDrag}
          onClick={() => {
            const toolName = "Instagram Tools";
            openTool({
                name: toolName,
                icon: FaInstagramSquare,
                renderContent: () => <InstagramToolsPanel onSelectTool={openTool} />
            });
          }}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[rgb(var(--bg-card))] active:scale-95 transition-all group"
        >
          <FaInstagramSquare className="text-[#E1306C] text-2xl group-hover:scale-110 transition-transform" />
        </button>

        <button
          onPointerDown={stopDrag}
          onClick={() => {
            const toolName = "Threads Tools";
            openTool({
                name: toolName,
                icon: FaSquareThreads,
                renderContent: () => <ThreadsToolsPanel onSelectTool={openTool} />
            });
          }}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[rgb(var(--bg-card))] active:scale-95 transition-all group"
        >
          <FaSquareThreads className={`text-2xl group-hover:scale-110 transition-transform ${theme === 'light' ? 'text-black' : 'text-white'}`} />
        </button>

        <button
          onPointerDown={stopDrag}
          onClick={() => {
            const toolName = "Virus Troll";
            openTool({
                name: toolName,
                icon: AiFillBug,
                renderContent: () => <VirusTrollPanel onSelectTool={openTool} />
            });
          }}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[rgb(var(--bg-card))] active:scale-95 transition-all group"
        >
          <AiFillBug className="text-green-500 text-2xl group-hover:scale-110 transition-transform" />
        </button>

        <div className="h-7 w-px bg-[rgba(var(--border-main),var(--border-opacity))] mx-2" />

        <button
          onPointerDown={stopDrag}
          onClick={() => setShowPanel(!showPanel)}
          className={`
            w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300
            ${showPanel 
              ? "bg-blue-600 shadow-lg shadow-blue-500/50 scale-110" 
              : "bg-[rgb(var(--bg-card))] hover:bg-[rgb(var(--bg-card-hover))] hover:scale-105"
            }
          `}
        >
          <Grid size={20} className={showPanel ? "text-white" : "text-[rgb(var(--text-muted))]"} />
        </button>

        <button
          onPointerDown={stopDrag}
          onClick={() => set("theme", theme === "dark" ? "light" : "dark")}
          className={`
            w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300
            ${theme === "light" 
              ? "bg-amber-100 shadow-lg scale-110" 
              : "bg-white/5 hover:bg-white/15 hover:scale-105"
            }
          `}
        >
          {theme === "dark" ? (
            <Moon size={20} className="text-gray-400" />
          ) : (
            <Sun size={20} className="text-amber-600" />
          )}
        </button>

        <button
          onPointerDown={stopDrag}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[rgb(var(--bg-card))] hover:bg-[rgb(var(--bg-card-hover))] hover:scale-105 active:scale-95 transition-all group"
        >
          <Settings size={20} className="text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--text-main))] transition-colors" />
        </button>

        <button
          onPointerDown={stopDrag}
          onClick={() => setShowFakeSidePanel(!showFakeSidePanel)}
          title="Open Chromex AI"
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] hover:scale-110 active:scale-95 transition-all group"
        >
          <PanelRightOpen size={20} className="text-white group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
