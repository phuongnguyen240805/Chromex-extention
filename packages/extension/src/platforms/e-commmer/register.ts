import { registerPlatform } from "../../core/register";
import { initializeEcommerBackground } from "./src/background";

export const registerEcommerPlatform = () => {
  registerPlatform({
    id: "e-commmer",
    name: "E-Commerce Sourcing & Dropshipping",
    onInitializeBackground: initializeEcommerBackground,
  });
};
