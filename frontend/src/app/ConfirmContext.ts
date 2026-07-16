import { createContext, useContext, type ReactNode } from "react";

export type ConfirmFn = (
  message: string,
  title?: string,
  confirmText?: ReactNode,
) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
