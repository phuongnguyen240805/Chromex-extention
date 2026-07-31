import { t } from "~i18n";

/**
 * Facebook Timer feature
 * Tracks time spent on Facebook and provides a usage summary
 */
export const initFBTimer = () => {
    console.log("FB AIO: Usage Timer initializing...");

    const getTodayKey = () => new Date().toISOString().split('T')[0];
    let startTime = Date.now();
    let totalSecondsToday = 0;
    const today = getTodayKey();

    chrome.storage.local.get([`fb_timer_${today}`], (res) => {
        totalSecondsToday = res[`fb_timer_${today}`] || 0;
    });

    setInterval(() => {
        if (document.visibilityState === 'visible') {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            startTime = now;
            totalSecondsToday += elapsed;
            chrome.storage.local.set({ [`fb_timer_${today}`]: totalSecondsToday });
        } else {
            startTime = Date.now();
        }
    }, 60000);

    (window as any).getFBTimeToday = () => {
        const hours = Math.floor(totalSecondsToday / 3600);
        const mins = Math.floor((totalSecondsToday % 3600) / 60);
        return t("fb_timer_summary", { hours, mins });
    };
};
