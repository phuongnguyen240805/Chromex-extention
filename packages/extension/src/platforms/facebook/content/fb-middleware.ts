/**
 * Facebook Middleware
 * Handles communication between content scripts and background services
 */
export const initFBMiddleware = () => {
    console.log("FB AIO: Middleware initializing...");

    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        if (event.data.type && event.data.type.startsWith('FB_AIO_')) {
            console.log("FB AIO: Received message from page:", event.data);
            // Forward to background script if needed
            chrome.runtime.sendMessage(event.data);
        }
    });

    console.log("FB AIO: Middleware Active");
};
