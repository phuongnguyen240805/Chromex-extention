import { t } from "~i18n";

/**
 * Global: AI Overlay
 * Adds a contextual button to summarize or translate selected text
 */
export const initAIOverlay = () => {
    console.log("Global AIO: AI Overlay initializing...");

    const buttonId = 'aio-ai-button';
    
    const createButton = (x: number, y: number, text: string) => {
        let btn = document.getElementById(buttonId);
        if (!btn) {
            btn = document.createElement('button');
            btn.id = buttonId;
            btn.style.cssText = `
                position: fixed;
                z-index: 2147483647;
                background: #4f46e5;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 12px;
                cursor: pointer;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s;
            `;
            btn.innerText = t("ai_summarize");
            document.body.appendChild(btn);
        }

        btn.style.display = 'block';
        btn.style.left = `${x}px`;
        btn.style.top = `${y + 10}px`;
        
        btn.onclick = () => {
            alert(`${t("ai_summarize")}: Summarizing text...\n\n"${text.substring(0, 100)}..."`);
            btn!.style.display = 'none';
        };
    };

    document.addEventListener('mouseup', (e) => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 20) {
            const range = selection!.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            createButton(rect.left + window.scrollX, rect.bottom + window.scrollY, selectedText);
        } else {
            const btn = document.getElementById(buttonId);
            if (btn) btn.style.display = 'none';
        }
    });

    console.log("Global AIO: AI Overlay Active");
};
