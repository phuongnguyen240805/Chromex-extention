
console.log("Sidepanel entry point starting...");

// Explicitly set body styles to avoid black screen issues
const style = document.createElement("style");
style.textContent = `
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100vh !important;
    background-color: #121315 !important;
    color: white;
    overflow: hidden;
  }
  #app {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
`;
document.head.appendChild(style);

// Ensure #app exists before importing the main logic
let app = document.getElementById("app");
if (!app) {
  console.log("Creating #app in entry point...");
  app = document.createElement("div");
  app.id = "app";
  app.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-family: sans-serif; color: #888;">Initializing Chromex...</div>`;
  document.body.appendChild(app);
} else {
  console.log("#app already exists in entry point.");
}



// Use dynamic import to ensure the code above (creating #app) runs first
// and to handle ESM module resolution more reliably in Plasmo/MV3.
import("./sidepanel/index").catch(err => {
  console.error("Failed to load sidepanel index:", err);
  if (app) app.innerHTML = `<div style="color: red; padding: 20px;">Failed to load sidepanel logic: ${err.message}</div>`;
});
import("../public/sidepanel.css").catch(err => console.error("Failed to load sidepanel css:", err));

import React from "react";
export default function SidepanelRoot() {
  return React.createElement("div", { id: "sidepanel-react-root", style: { display: "none" } });
}



