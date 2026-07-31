import { useRef, useCallback, useEffect } from "react";

interface FocusRestoreOptions {
  /** Prefix cho data attribute để tránh conflict */
  idPrefix?: string;
  /** Tự động restore focus sau khi render (mặc định = true) */
  autoRestore?: boolean;
  /** Selector fallback nếu không tìm thấy element */
  fallbackSelector?: string;
}

export const useFocusRestore = (options: FocusRestoreOptions = {}) => {
  const {
    idPrefix = "wsk",
    autoRestore = true,
    fallbackSelector,
  } = options;

  const activeIdRef = useRef<string | null>(null);

  // Lưu focus hiện tại
  const saveFocus = useCallback(() => {
    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl?.dataset?.wskId?.startsWith(idPrefix)) {
      activeIdRef.current = activeEl.dataset.wskId;
    }
  }, [idPrefix]);

  // Khôi phục focus
  const restoreFocus = useCallback(() => {
    if (!activeIdRef.current) return;

    requestAnimationFrame(() => {
      let el = document.querySelector(
        `[data-wsk-id="${activeIdRef.current}"]`
      ) as HTMLElement | null;

      // Fallback nếu không tìm thấy
      if (!el && fallbackSelector) {
        el = document.querySelector(fallbackSelector) as HTMLElement | null;
      }

      if (el) {
        el.focus();

        // Giữ vị trí con trỏ cho input/textarea
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      }

      // Reset sau khi restore
      activeIdRef.current = null;
    });
  }, [fallbackSelector]);

  // Tự động restore (nếu bật)
  useEffect(() => {
    if (autoRestore) {
      // Có thể gọi restoreFocus ở đây nếu cần
      return;
    }
  }, [autoRestore]);

  return {
    saveFocus,
    restoreFocus,
    // Helper tiện lợi
    focusWithId: (id: string) => {
      const el = document.querySelector(`[data-wsk-id="${id}"]`) as HTMLElement;
      el?.focus();
    },
  } as const;
};