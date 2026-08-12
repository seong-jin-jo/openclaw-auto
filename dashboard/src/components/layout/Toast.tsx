"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface ToastCtx {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastCtx>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

const COLORS: Record<string, string> = {
  success: "bg-success text-white border-success",
  error: "bg-danger text-white border-danger",
  warning: "bg-warning text-white border-warning",
  info: "bg-accent text-accent-fg border-accent",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" id="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded border text-sm shadow-lg transition-opacity duration-300 ${COLORS[t.type] || COLORS.info}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function ToastContainer() {
  return null;
}
