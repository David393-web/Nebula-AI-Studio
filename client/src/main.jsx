import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import App from "./App";

import { queryClient } from "@/config/queryClient";

import "@/styles/globals.css";
import "@/styles/variables.css";
import "@/styles/typography.css";
import "@/styles/animations.css";
import "@/styles/tailwind.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);