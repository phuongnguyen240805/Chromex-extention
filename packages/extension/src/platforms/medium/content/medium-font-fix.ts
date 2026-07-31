/**
 * Medium Font Fix
 * Fixes font display issues on Medium and improves readability
 */
export const initMediumFontFix = () => {
    console.log("Medium AIO: Font Fix initializing...");

    const style = document.createElement('style');
    style.innerHTML = `
        /* Force better fonts on Medium */
        p, h1, h2, h3, h4, li {
            font-family: "Charter", "Georgia", serif !important;
            line-height: 1.6 !important;
        }
        /* Improve contrast */
        body { color: #1a1a1a !important; }
    `;
    document.head.appendChild(style);

    console.log("Medium AIO: Font Fix Active");
};
