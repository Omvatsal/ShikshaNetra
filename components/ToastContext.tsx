"use client";

import { createContext, ReactNode, useCallback, useContext, useState } from "react";

type Toast = {
  id: number;
  message: string;
};

type ToastContextType = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    setToasts((prev) => {
      const id = Date.now();
      return [...prev, { id, message }];
    });
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <div className="space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-950/95 px-4 py-2 text-sm text-slate-50 shadow-2xl ring-1 ring-slate-700/70 backdrop-blur animate-[fade-in_0.2s_ease-out]"
            >
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
