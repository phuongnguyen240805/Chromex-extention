import { initAIOverlay } from "./ai-overlay";
import { initEnableRightClick } from "./enable-right-click";
import { initJSONPrettifier } from "./json-prettifier";

export const initGlobalFeatures = () => {
    initEnableRightClick();
    initJSONPrettifier();
    initAIOverlay();
    console.log("Global features loaded");
};
