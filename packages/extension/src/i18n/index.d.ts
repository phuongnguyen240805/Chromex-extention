/**
 * Translate a key using chrome.i18n.getMessage
 * @param key The message key in messages.json
 * @param substitutions Optional substitutions for $key$ placeholders
 * @returns The translated string or the key if not found
 */
export declare const t: (key: string, substitutions?: Record<string, string | number>) => string;
/**
 * React hook for using translations in components
 */
export declare const useTranslation: () => {
    t: (key: string, substitutions?: Record<string, string | number>) => string;
    currentLocale: string;
};
