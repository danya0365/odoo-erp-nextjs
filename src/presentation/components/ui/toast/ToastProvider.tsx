// Toast system — context + คิว + auto-dismiss + portal viewport
//  - wire <ToastProvider> ที่ root (ครอบใน ThemeProvider) แล้วเรียกผ่าน useToast() ได้ทั้งแอป
"use client";

import {
  createContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";
import { useMounted } from "@/src/presentation/hooks/use-mounted";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "description">> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const CONFIG: Record<ToastVariant, { icon: LucideIcon; text: string }> = {
  info: { icon: Info, text: "text-foreground" },
  success: { icon: CheckCircle2, text: "text-success" },
  warning: { icon: AlertTriangle, text: "text-warning" },
  error: { icon: XCircle, text: "text-error" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const mounted = useMounted();
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "info", duration = 4000 }: ToastOptions) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, title, description, variant, duration }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed bottom-4 right-4 z-100 flex w-full max-w-sm flex-col gap-2">
            {toasts.map((t) => {
              const { icon: Icon, text } = CONFIG[t.variant];
              return (
                <div
                  key={t.id}
                  role="status"
                  className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg"
                >
                  <Icon className={cn("mt-0.5 size-5 shrink-0", text)} />
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{t.title}</p>
                    {t.description && (
                      <p className="mt-0.5 text-sm text-muted">{t.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="ปิด"
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
