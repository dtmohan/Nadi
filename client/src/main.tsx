import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource-variable/fraunces/wght.css";
import "@fontsource/manjari/malayalam-400.css";
import "@fontsource/manjari/malayalam-700.css";
import "./index.css";

if (!window.location.hash) {
  window.location.hash = "#/";
}

createRoot(document.getElementById("root")!).render(<App />);
