import { registerPlatform } from "../../core/register";
import { initializeFacebookBackground } from "./background";
import { initFacebookFeatures } from "./content";

export const registerFacebookPlatform = () => {
  registerPlatform({
    id: "facebook",
    name: "Facebook AIO",
    onInitializeBackground: initializeFacebookBackground,
    onInitializeContent: initFacebookFeatures
  });
};
