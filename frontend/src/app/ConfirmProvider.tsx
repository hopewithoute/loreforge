import { useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ConfirmContext, type ConfirmFn } from "./ConfirmContext";

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("Confirm Action");
  const [confirmText, setConfirmText] = useState<ReactNode>("Confirm");
  const resolver = useRef<{ resolve: (value: boolean) => void } | null>(null);

  const confirm: ConfirmFn = useCallback(
    (msg: string, titleStr = "Confirm Action", confirmBtn: ReactNode = "Confirm") => {
      setMessage(msg);
      setTitle(titleStr);
      setConfirmText(confirmBtn);
      setIsOpen(true);
      return new Promise((resolve) => {
        resolver.current = { resolve };
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolver.current) resolver.current.resolve(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolver.current) resolver.current.resolve(false);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--canvas)/60 backdrop-blur-[2px]">
          <div className="animate-in fade-in zoom-in-95 w-[320px] border-2 border-(--graphite) bg-(--paper) p-6 shadow-[8px_8px_0px_rgba(28,28,26,1)] duration-200">
            <h3 className="mb-4 font-mono text-[14px] font-bold tracking-wide text-(--graphite) uppercase">
              {title}
            </h3>
            <p className="mb-8 font-mono text-[12px] leading-relaxed text-(--graphite) opacity-90">
              {message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className={cn(
                  "flex-1 cursor-pointer border border-(--graphite) bg-transparent p-2",
                  "font-mono text-xs tracking-wider text-(--graphite) uppercase",
                  "transition-colors duration-200 hover:bg-(--graphite) hover:text-(--paper)",
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={cn(
                  "flex-1 cursor-pointer border border-(--red-pencil) bg-[rgba(189,49,36,0.05)] p-2",
                  "font-mono text-xs font-bold tracking-wider text-(--red-pencil) uppercase",
                  "transition-colors duration-200 hover:bg-(--red-pencil) hover:text-(--paper)",
                )}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
