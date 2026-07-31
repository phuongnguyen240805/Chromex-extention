import { registerFacebookPlatform } from "../platforms/facebook/register";
import { registerEcommerPlatform } from "../platforms/e-commmer/register";
import { registerKeywordTools } from "../platforms/keyword-tools/src";
import { platformRegistrar } from "./register";

export const bootIntegratedPlatforms = () => {
  console.log("🌟 Platform Orchestrator: Starting integrated modules setup...");
  
  // 1. Khai báo tập trung toàn bộ các module nền tảng tại đây
  registerFacebookPlatform();
  registerEcommerPlatform();
  registerKeywordTools(platformRegistrar);
  // registerTikTokPlatform();
  // registerInstagramPlatform();
  
  // 2. Kích hoạt đồng loạt nền ngầm chuyên biệt của từng mục
  platformRegistrar.initializeBackgroundAll();
};

