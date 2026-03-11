import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import App from "./App";
import "./index.css";

const rawFetch = window.fetch.bind(window);
const apiBase = (import.meta as any).env?.VITE_API_URL as string | undefined;
if (apiBase && apiBase.includes("://")) {
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/api")) {
      return rawFetch(`${apiBase}${input}`, init);
    }
    return rawFetch(input as any, init);
  };
}

// Initialize Vercel Web Analytics
inject();

createRoot(document.getElementById("root")!).render(<App />);
