import React from "react";
import ReactDOM from "react-dom/client";
import "./wails-mock";
import App from "../App";
import "../lib/i18n";
import "../index.css";
import { clearThemeStorage } from "@/lib/themes";
import { seedShowcase } from "./seed";

clearThemeStorage();

const scene = new URLSearchParams(window.location.search).get("scene");
seedShowcase(scene);

document.documentElement.classList.remove("light");
document.documentElement.classList.add("dark");
document.documentElement.style.colorScheme = "dark";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
