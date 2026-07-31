import React, { useEffect } from "react";

/**
 * Popup entrypoint — immediately opens the Side Panel instead of
 * showing the standalone Keywords Everywhere popup.
 * All keyword tools are now accessible from the Dock → MegaMenu.
 */
export default function Popup() {
  useEffect(() => {
    // Open side panel and close popup
    chrome.runtime.sendMessage({ cmd: "open-side-panel" }).catch(() => {});
    // Also try the sidePanel API directly
    if (chrome.sidePanel?.open) {
      chrome.sidePanel.open({ windowId: undefined as any }).catch(() => {});
    }
    // Close the popup after a short delay
    setTimeout(() => window.close(), 300);
  }, []);

  return (
    <div style={{
      width: 200,
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0F172A",
      color: "#94A3B8",
      fontFamily: "system-ui, sans-serif",
      fontSize: 11,
      fontWeight: 600,
    }}>
      Opening panel...
    </div>
  );
}
