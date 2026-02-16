import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.log("SW registration failed:", err);
    });
  });

  window.addEventListener("online", () => {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        reg.active.postMessage("lc3-replay-sync");
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
