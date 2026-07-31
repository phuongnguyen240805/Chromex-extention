/**
 * Global: JSON Prettifier
 * Automatically detects JSON content pages and prettifies them with syntax highlighting
 */
export const initJSONPrettifier = () => {
    if (!document.body) {
        document.addEventListener("DOMContentLoaded", () => initJSONPrettifier());
        return;
    }

    const raw = document.body.innerText.trim();
    // Only run if the content looks like JSON and the page is plain text
    const isPlainText = document.contentType === 'application/json' || 
                        (document.contentType === 'text/plain' && raw.startsWith('{'));

    if (!isPlainText) return;

    try {
        const json = JSON.parse(raw);
        
        console.log("Global AIO: Prettifying JSON...");

        // Basic CSS for JSON highlighting
        const style = document.createElement('style');
        style.innerHTML = `
            body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
            .json-key { color: #9cdcfe; }
            .json-string { color: #ce9178; }
            .json-number { color: #b5cea8; }
            .json-boolean { color: #569cd6; }
            .json-null { color: #569cd6; }
        `;
        document.head.appendChild(style);

        // Simple formatter
        const formatted = JSON.stringify(json, null, 2)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) cls = 'json-key';
                    else cls = 'json-string';
                } else if (/true|false/.test(match)) cls = 'json-boolean';
                else if (/null/.test(match)) cls = 'json-null';
                return '<span class="' + cls + '">' + match + '</span>';
            });

        document.body.innerHTML = `<pre>${formatted}</pre>`;
    } catch (e) {
        // Not valid JSON, skip
    }
};
