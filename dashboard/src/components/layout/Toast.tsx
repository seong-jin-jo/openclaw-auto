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
  success: "bg-green-800 text-green-200 border-green-600",
  error: "bg-red-800 text-red-200 border-red-600",
  warning: "bg-yellow-800 text-yellow-200 border-yellow-600",
  info: "bg-blue-800 text-blue-200 border-blue-600",
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
