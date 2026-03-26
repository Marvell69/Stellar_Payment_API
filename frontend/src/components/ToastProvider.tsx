"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#0f1a2b",
          color: "#f3f5f7",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: {
          iconTheme: {
            primary: "#5ef2c0",
            secondary: "#0b0c10",
          },
        },
        error: {
          iconTheme: {
            primary: "#f87171",
            secondary: "#0b0c10",
          },
        },
      }}
    />
  );
}
