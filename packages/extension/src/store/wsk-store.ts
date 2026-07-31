import { Storage } from "@plasmohq/storage"
import { create } from "zustand"
import { persist } from "zustand/middleware"

const storage = new Storage({ area: "local" })

export type Premium = {
  status: "free" | "premium"
  email: string | null
  licenseKey: string | null
  expiryDate: string | null
  _hash: string | null
}

/**
 * Simple hash generator to prevent basic tampering.
 */
export const generateHash = (status: string, licenseKey: string): string => {
  return btoa(`chromex:${status}:${licenseKey}`).split("").reverse().join("")
}


interface WSKState {
  theme: string
  colorTheme: string
  dockVisible: boolean
  activeTool: string | null
  dockX: number
  dockY: number
  launcherX: number
  launcherY: number
  premium: Premium
  uiGrayscale: boolean
  
  // Facebook Features
  blockSeenChat: boolean
  blockSeenStory: boolean
  blockTyping: boolean
  blockPixel: boolean
  showTimer: boolean
  antiPhishing: boolean
  stopNewFeed: boolean
  showReactions: boolean
  fbVideoDownload: boolean
  
  // Instagram Features
  igBlockSeen: boolean
  igDownloadStory: boolean
  
  // Threads Features
  threadsBlockSeen: boolean
  threadsHidePosts: boolean
  
  // TikTok Features
  ttNoWatermark: boolean
  ttAutoScroll: boolean
  
  // Tool Configs
  toolConfigs: Record<string, { x: number, y: number, isMinimized: boolean }>
  
  // Actions
  set: (key: string, value: any) => void
  setPremium: (premium: Partial<Premium>) => void
  reset: () => void
  [key: string]: any 
}

const DEFAULT_STATE = {
  theme: "dark",
  colorTheme: "indigo",
  dockVisible: false,
  dockX: 0,
  dockY: 0,
  launcherX: 0,
  launcherY: 0,
  activeTool: null as string | null,
  premium: { 
    status: "free" as "free" | "premium", 
    email: null as string | null, 
    licenseKey: null as string | null, 
    expiryDate: null as string | null, 
    _hash: null as string | null 
  },
  blockSeenChat: false,
  blockSeenStory: false,
  blockTyping: false,
  blockPixel: false,
  showTimer: false,
  antiPhishing: false,
  stopNewFeed: false,
  showReactions: false,
  fbVideoDownload: false,
  igBlockSeen: false,
  igDownloadStory: false,
  threadsBlockSeen: false,
  threadsHidePosts: false,
  ttNoWatermark: false,
  ttAutoScroll: false,
  uiGrayscale: false,
  toolConfigs: {} as Record<string, { x: number, y: number, isMinimized: boolean }>,
}

export const useWSKStore = create<WSKState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      set: (key, value) => {
        set((state) => {
          const newState = { ...state };
          const keys = key.split(".");
          let current: any = newState;
          
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i] as string;
            current[k] = { ...current[k] };
            current = current[k];
          }
          
          const lastKey = keys[keys.length - 1] as string;
          current[lastKey] = value;
          return newState;
        });
      },

      setPremium: (premiumData) => {
        set((state) => ({
          premium: { ...state.premium, ...premiumData }
        }));
      },

      reset: () => {
        set(DEFAULT_STATE)
      }
    }),
    {
      name: "wsk-state",
      storage: {
        getItem: async (name) => {
          const val = await storage.get(name)
          // Plasmo Storage tự động parse JSON nếu dữ liệu là object
          return typeof val === "string" ? JSON.parse(val) : val
        },
        setItem: async (name, value) => {
          // Lưu trực tiếp object, Plasmo Storage sẽ tự stringify
          await storage.set(name, value)
        },
        removeItem: async (name) => {
          await storage.remove(name)
        },
      },
    }
  )
)
