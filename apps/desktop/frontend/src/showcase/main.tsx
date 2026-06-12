import React from "react";
import ReactDOM from "react-dom/client";
import "./wails-mock";
import App from "../App";
import "../lib/i18n";
import "../index.css";
import { seedShowcase } from "./seed";

const scene = new URLSearchParams(window.location.search).get("scene");
seedShowcase(scene);

document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
