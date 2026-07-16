import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "./app/App";
import "./app/styles/global.css";
import { queryClient } from "./app/queryClient";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("LoreForge root element was not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
