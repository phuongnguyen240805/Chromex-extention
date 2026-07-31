import React, { useState, useRef, useEffect } from "react";
import { X, Search, Minus, Maximize2, Minimize2, GripHorizontal } from "lucide-react";
import { useWSKStore } from "~store/wsk-store";

interface ToolDetailPanelProps {
  tool: {
    name: string;
    icon?: React.ElementType;
    renderContent?: () => React.ReactNode;
    isFullscreen?: boolean;
    panelSize?: {
      width: number;
      height: number;
    };
    contentMode?: "scroll" | "fill";
  };
  onClose: () => void;
}

export const ToolDetailPanel = ({ tool, onClose }: ToolDetailPanelProps) => {
  const { toolConfigs, set } = useWSKStore();
  
  const getCenterPos = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const panelWidth = tool.panelSize
      ? Math.min(tool.panelSize.width, width - 32)
      : Math.min(512, width * 0.9);
    const panelHeight = tool.panelSize
      ? Math.min(tool.panelSize.height, height - 32)
      : Math.min(600, height * 0.8);
    return {
      x: (width - panelWidth) / 2,
      y: (height - panelHeight) / 2
    };
  };

  const defaultPos = getCenterPos();
  const config = tool.panelSize
    ? { ...defaultPos, isMinimized: false }
    : toolConfigs[tool.name] || { ...defaultPos, isMinimized: false };

  const Icon = tool.icon;
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(config.isMinimized);
  const [isFullscreen, setIsFullscreen] = useState(tool.isFullscreen ?? false);
  
  const posRef = useRef({ x: config.x, y: config.y });
  const startDragPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const updateConfig = (updates: any) => {
    set("toolConfigs", {
      ...toolConfigs,
      [tool.name]: {
        ...config,
        ...updates
      }
    });
  };

  const handleDragStart = (e: React.PointerEvent) => {
    if (isFullscreen) return;
    if (e.button !== 0) return;

    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    
    const startX = e.clientX - posRef.current.x;
    const startY = e.clientY - posRef.current.y;
    setIsDragging(true);

    const onMove = (ev: PointerEvent) => {
      const newX = ev.clientX - startX;
      const newY = ev.clientY - startY;
      posRef.current = { x: newX, y: newY };
      if (panelRef.current) {
        panelRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
      }
    };

    const onUp = (ev: PointerEvent) => {
      setIsDragging(false);
      handle.releasePointerCapture(e.pointerId);
      updateConfig({ x: posRef.current.x, y: posRef.current.y });
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  };

  useEffect(() => {
    setIsFullscreen(tool.isFullscreen ?? false);
    const newConfig = tool.panelSize
      ? getCenterPos()
      : toolConfigs[tool.name] || getCenterPos();
    posRef.current = { x: newConfig.x, y: newConfig.y };
    if (panelRef.current) {
      panelRef.current.style.transform = tool.isFullscreen 
        ? 'none' 
        : `translate3d(${newConfig.x}px, ${newConfig.y}px, 0)`;
    }
  }, [tool.name]);

  return (
    <div
      ref={panelRef}
      className={`
        fixed z-[2147483647] shadow-2xl border border-[rgba(var(--border-main),var(--border-opacity))] 
        bg-[rgb(var(--bg-main))] flex flex-col pointer-events-auto overflow-hidden
        ${isFullscreen 
          ? "inset-0 w-screen h-screen rounded-none max-h-none" 
          : tool.panelSize
            ? "rounded-3xl cursor-default"
            : "w-full max-w-lg rounded-3xl max-h-[85vh] cursor-default"
        }
        ${isDragging ? "scale-[1.01] shadow-blue-500/30 !transition-none ring-1 ring-blue-500/50 cursor-grabbing select-none" : (!isFullscreen ? "transition-all duration-300 ease-out" : "")}
      `}
      style={
        isFullscreen
          ? { transform: "none" }
          : {
              left: 0,
              top: 0,
              transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`,
              willChange: "transform",
              ...(tool.panelSize
                ? {
                    width: `${Math.min(tool.panelSize.width, window.innerWidth - 32)}px`,
                    height: `${Math.min(tool.panelSize.height, window.innerHeight - 32)}px`,
                  }
                : {}),
            }
      }
    >
      {/* ==================== HEADER ==================== */}
      {!isFullscreen && (
        <div className="px-6 py-4 border-b border-[rgba(var(--border-main),var(--border-opacity))] flex items-center justify-between bg-[rgb(var(--bg-card))] shrink-0 rounded-t-3xl select-none pointer-events-auto">
          {/* Drag Handle - Left Side */}
          <div 
            onPointerDown={handleDragStart}
            className="flex items-center gap-4 flex-1 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center justify-center pointer-events-none">
              {Icon ? <Icon size={24} className="text-blue-400" /> : <Search size={24} className="text-blue-400" />}
            </div>
            <h1 className="text-lg font-semibold font-inter text-[rgb(var(--text-main))] pointer-events-none">{tool.name}</h1>
            <GripHorizontal size={16} className="text-[rgb(var(--text-muted))] opacity-20 ml-auto pointer-events-none" />
          </div>

          {/* Buttons - Right Side */}
          <div className="flex items-center gap-2 ml-4 pointer-events-auto">
            <button 
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setIsMinimized(false);
              }}
              className="w-8 h-8 flex items-center justify-center hover:bg-[rgb(var(--bg-card-hover))] rounded-2xl transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={18} className="text-[rgb(var(--text-muted))]" /> : <Maximize2 size={18} className="text-[rgb(var(--text-muted))]" />}
            </button>

            {!isFullscreen && (
              <button 
                onClick={() => {
                  const newState = !isMinimized;
                  setIsMinimized(newState);
                  updateConfig({ isMinimized: newState });
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-[rgb(var(--bg-card-hover))] rounded-2xl transition-colors cursor-pointer"
              >
                <Minus size={20} className="text-[rgb(var(--text-muted))]" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-[rgb(var(--bg-card-hover))] rounded-2xl transition-colors cursor-pointer"
            >
              <X size={22} className="text-[rgb(var(--text-muted))] hover:text-red-500" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== BODY ==================== */}
      {!isMinimized && (
        <div 
          className="flex-1 min-h-0 rounded-b-3xl pointer-events-auto custom-scrollbar"
          style={{
            overflowY: tool.contentMode === "fill" ? "hidden" : "scroll",
            overscrollBehaviorY: "contain",
          }}
        >
          {tool.renderContent ? (
             tool.renderContent()
          ) : (
            <div className="flex items-center justify-center text-center p-10">
              <div>
                <div className="flex items-center justify-center mb-8 mx-auto">
                  {Icon ? <Icon size={64} className="text-[rgb(var(--text-muted))] opacity-70" /> : <Search size={64} className="text-[rgb(var(--text-muted))] opacity-70" />}
                </div>
                <h2 className="text-lg font-semibold font-inter text-[rgb(var(--text-main))] mb-3">Tool is ready</h2>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
