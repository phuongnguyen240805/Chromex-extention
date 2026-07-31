// Facebook Features Loader
import { initFBMiddleware } from "./fb-middleware";

// Import core features from hooks
import { initAntiPhishing } from "../hooks/anti-fb-phishing";
import { initFBTimer } from "../hooks/fb-timer";
import { initAddDownloadVideoBtn } from "../hooks/addDownloadVideoBtn";
import { initShowTotalPostReactions } from "../hooks/showTotalPostReactions";
import { initStopNewFeed } from "../hooks/stopNewFeed";
import { initBlockSeenStory } from "../hooks/blockSeenStory";
import { initProfileInsights } from "../hooks/profileInsights";

export const initFacebookFeatures = (settings: any) => {
    console.log("🚀 FB AIO: Initializing Facebook features from hooks...");
    
    // Initialize exported features
    initFBMiddleware();
    
    if (settings.antiPhishing === true) initAntiPhishing();
    if (settings.showTimer !== false) initFBTimer();
    if (settings.fbVideoDownload !== false) initAddDownloadVideoBtn(settings);
    if (settings.showReactions !== false) initShowTotalPostReactions(settings);
    if (settings.stopNewFeed !== false) initStopNewFeed(settings);
    if (settings.blockSeenStory !== false) initBlockSeenStory(settings);
    if (settings.profileInsights !== false) initProfileInsights(settings);

    console.log("✅ FB AIO: All Facebook features active.");
};
