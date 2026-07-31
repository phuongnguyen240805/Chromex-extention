export type PlatformType = "facebook" | "instagram" | "tiktok" | "threads" | "virus";
export interface Tool {
    name: string;
    i18nKey?: string;
    icon: React.ComponentType<any>;
    color: string;
    link?: string;
    description?: string;
}
export interface ToolCategory {
    title: string;
    i18nKey?: string;
    tools: Tool[];
}
export declare const FACEBOOK_TOOLS: ToolCategory[];
export declare const INSTAGRAM_TOOLS: ToolCategory[];
export declare const TIKTOK_TOOLS: ToolCategory[];
export declare const THREADS_TOOLS: ToolCategory[];
export interface VirusTool extends Tool {
    link: string;
}
export interface VirusToolCategory extends ToolCategory {
    tools: VirusTool[];
}
export declare const VIRUS_TROLL_TOOLS: VirusToolCategory[];
export declare const getToolsForPlatform: (platform: PlatformType) => ToolCategory[];
