"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

/** @typedef {{ id: number; variant: "success" | "error"; text: string }} ToastItem */

const ToastContext = createContext(null);

const toastStyles = {
  success: "bg-[#FAF6F0] text-[#0B4D53] ring-[#2DD4BF]/40 border border-[#0B4D53]/10",
  error: "bg-[#3f1515] text-[#FEE2E2] ring-red-400/30 border border-red-400/20",
};

export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState(/** @type {ToastItem[]} */ ([]));

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((variant, text) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, variant, text }]);
    return id;
  }, []);

  const toast = useMemo(
    () => ({
      success: (text) => pushToast("success", text),
      error: (text) => pushToast("error", text),
    }),
    [pushToast]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-[100] flex w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 flex-col gap-2 px-safe"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <ToastBanner key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** @param {{ item: ToastItem; onDismiss: () => void }} props */
function ToastBanner({ item, onDismiss }) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(id);
  }, [onDismiss]);

  return (
    <div
      role={item.variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto rounded-xl px-4 py-3 text-center text-sm leading-relaxed shadow-lg ring-1",
        toastStyles[item.variant]
      )}
    >
      {item.text}
    </div>
  );
}

export function useAdminToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useAdminToast must be used within AdminToastProvider");
  return ctx.toast;
}
