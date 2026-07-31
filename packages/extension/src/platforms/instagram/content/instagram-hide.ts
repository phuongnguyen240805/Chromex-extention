/**
 * Instagram Hide Elements
 * Hides specific UI elements on Instagram for a cleaner experience
 */
export const initInstagramHide = () => {
    console.log("Instagram AIO: Hide Elements initializing...");

    const style = document.createElement('style');
    style.innerHTML = `
        /* Hide suggested posts */
        div:has(> span:contains("Suggested for you")) { display: none !important; }
        /* Hide ads in stories */
        div[aria-label="Story"] div:has(> div:contains("Sponsored")) { display: none !important; }
    `;
    document.head.appendChild(style);

    console.log("Instagram AIO: Hide Elements Active");
};
