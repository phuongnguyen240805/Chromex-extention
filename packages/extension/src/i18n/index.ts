import { useMemo } from 'react';

/**
 * Translate a key using chrome.i18n.getMessage
 * @param key The message key in messages.json
 * @param substitutions Optional substitutions for $key$ placeholders
 * @returns The translated string or the key if not found
 */
export const t = (key: string, substitutions?: Record<string, string | number>): string => {
  // chrome.i18n might not be available in some contexts or during dev
  if (typeof chrome === 'undefined' || !chrome.i18n) {
    return key;
  }

  let message = chrome.i18n.getMessage(key) || key;
  
  if (substitutions) {
    Object.entries(substitutions).forEach(([k, v]) => {
      message = message.replace(`$${k}$`, String(v));
    });
  }
  return message;
};

/**
 * React hook for using translations in components
 */
export const useTranslation = () => {
  return useMemo(() => ({
    t,
    currentLocale: (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage?.()) || 'en'
  }), []);
};
