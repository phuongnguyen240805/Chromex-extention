import React from "react";
interface PremiumToolCardProps {
    tool: {
        name: string;
        icon: React.ComponentType<any>;
        color?: string;
        i18nKey?: string;
        shortcut?: string;
        description?: string;
    };
    onClick: () => void;
    onToggle?: (val: boolean) => void;
    isActive?: boolean;
    compact?: boolean;
    showToggle?: boolean;
}
export declare const PremiumToolCard: React.FC<PremiumToolCardProps>;
export {};
