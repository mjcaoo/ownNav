"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";

type AdminModalProps = {
  triggerLabel: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function AdminModal({ triggerLabel, title, description, children }: AdminModalProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="admin-button">
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-3 backdrop-blur-sm">
          <button
            type="button"
            aria-label="关闭弹窗"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/20 sm:p-5"
            onSubmit={() => setOpen(false)}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-lg font-bold text-slate-900">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-lg font-bold text-slate-500 transition hover:bg-slate-200"
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            {children}
          </section>
        </div>
      ) : null}
    </>
  );
}
