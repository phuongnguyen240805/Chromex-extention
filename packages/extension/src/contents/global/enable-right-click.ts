/**
 * Global: Enable Right Click
 * Unblocks context menu and selection on websites that try to disable them
 */
export const initEnableRightClick = () => {
    console.log("Global AIO: Enable Right Click initializing...");

    const enableActions = () => {
        const events = ['contextmenu', 'copy', 'cut', 'paste', 'selectstart', 'mousedown', 'mouseup'];
        events.forEach(eventName => {
            window.addEventListener(eventName, (e) => e.stopPropagation(), true);
        });

        // Inject CSS to force user-select
        const style = document.createElement('style');
        style.innerHTML = `
            * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    };

    // Run every few seconds to catch dynamic changes
    setInterval(enableActions, 5000);
    enableActions();

    console.log("Global AIO: Enable Right Click Active");
};
