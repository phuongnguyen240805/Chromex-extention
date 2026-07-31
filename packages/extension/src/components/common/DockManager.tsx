import React, { useState, useRef, useEffect } from "react"
import { useWSKStore } from "~store/wsk-store"
import { DraggableDockBar } from "../dock/DraggableDockBar"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import avocadoLottie from "url:../../assets/Avocado.lottie"

export const DockManager = () => {
  const { dockVisible, launcherX, launcherY, set } = useWSKStore()
  const [isDragging, setIsDragging] = useState(false)
  const launcherRef = useRef<HTMLDivElement>(null)
  const launcherPosRef = useRef({ x: launcherX, y: launcherY })

  const isDraggingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    const currentTarget = e.currentTarget as HTMLElement;
    currentTarget.setPointerCapture(e.pointerId);

    const startX = e.clientX - launcherPosRef.current.x;
    const startY = e.clientY - launcherPosRef.current.y;
    let moved = false;

    const onPointerMove = (ev: PointerEvent) => {
      const newX = ev.clientX - startX;
      const newY = ev.clientY - startY;
      
      // Chỉ tính là đang kéo nếu di chuyển hơn 20px (đã được user chỉnh sửa)
      if (Math.abs(ev.clientX - (startX + launcherPosRef.current.x)) > 20 || 
          Math.abs(ev.clientY - (startY + launcherPosRef.current.y)) > 20) {
        moved = true;
        setIsDragging(true);
        isDraggingRef.current = true;
      }

      if (moved) {
        launcherPosRef.current = { x: newX, y: newY };
        if (launcherRef.current) {
          launcherRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
        }
      }
    };

    const onPointerUp = (ev: PointerEvent) => {
      currentTarget.releasePointerCapture(e.pointerId);
      if (moved) {
        set("launcherX", launcherPosRef.current.x);
        set("launcherY", launcherPosRef.current.y);
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
    launcherPosRef.current = { x: launcherX, y: launcherY };
    if (launcherRef.current) {
      launcherRef.current.style.transform = `translate(${launcherX}px, ${launcherY}px)`;
    }
  }, [launcherX, launcherY]);

  return (
    <>
      {/* Floating Launcher (Middle-Left) */}
      <div 
        ref={launcherRef}
        onPointerDown={handlePointerDown}
        className={`fixed top-1/2 left-0 -translate-y-1/2 z-[10001] p-3 bg-amber-900/40 backdrop-blur-xl rounded-full border-4 border-dashed border-amber-600/30 cursor-grab active:cursor-grabbing ${isDragging ? '!transition-none' : 'transition-transform duration-300'} hover:bg-amber-900/60 hover:border-amber-500/50 shadow-[0_0_25px_rgba(120,66,18,0.3)]`}
        style={{
          transform: `translate(${launcherPosRef.current.x}px, ${launcherPosRef.current.y}px)`,
          touchAction: "none"
        }}
      >
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (isDraggingRef.current) return;
            set("dockVisible", !dockVisible);
          }}
          className="w-10 h-10 rounded-full premium-gradient shadow-xl flex items-center justify-center text-white active:scale-95 transition-all duration-300 overflow-hidden"
        >
          <DotLottieReact
            src={avocadoLottie}
            autoplay
            loop
            style={{ width: '100%', height: '100%' }}
          />
        </button>   
      </div>

      {/* Main Dock */}
      {dockVisible && <DraggableDockBar />}
    </>
  )
}