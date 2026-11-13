"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckIcon, CloseIcon, AlertIcon } from "../ui/icons";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description, tone = "success" }) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setItems((current) => [...current.slice(-2), { id, title, description, tone }]);
      const timer = setTimeout(() => dismiss(id), 4500);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((item) => (
          <div className="toast" data-tone={item.tone} key={item.id}>
            <span className="mt-0.5 shrink-0" style={{ opacity: 0.9 }}>
              {item.tone === "error" ? <AlertIcon size={17} /> : <CheckIcon size={17} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-5">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-[12.5px] leading-5" style={{ color: "rgba(255,255,255,0.72)" }}>
                  {item.description}
                </p>
              ) : null}
            </div>
            <button
              aria-label="Dismiss notification"
              className="shrink-0 rounded-md p-1 opacity-60 transition hover:opacity-100"
              onClick={() => dismiss(item.id)}
              type="button"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
