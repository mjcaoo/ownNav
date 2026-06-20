"use client";

import { useEffect, useRef, useState } from "react";

const ICON_OPTIONS = [
  "📁",
  "🔖",
  "⭐",
  "🧰",
  "🛠️",
  "💼",
  "🧾",
  "💳",
  "🌐",
  "☁️",
  "🖥️",
  "🗄️",
  "📦",
  "📚",
  "📝",
  "🧪",
  "🤖",
  "🎨",
  "🎮",
  "🎬",
  "🎵",
  "📷",
  "🔐",
  "🚀",
  "⚙️",
  "📊",
  "🧭",
  "🏷️",
  "💡",
  "🧩",
];

export function CategoryIconPicker({
  name = "icon",
  defaultValue = "📁",
  compact = false,
}: {
  name?: string;
  defaultValue?: string;
  compact?: boolean;
}) {
  const [icon, setIcon] = useState(defaultValue || "📁");
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={pickerRef} className="relative">
      <input type="hidden" name={name} value={icon} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={[
          "admin-input flex items-center justify-between gap-2 text-left",
          compact ? "h-9 px-2" : "h-10",
        ].join(" ")}
      >
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 text-base">
          {icon}
        </span>
        <span className={compact ? "sr-only" : "text-xs font-semibold text-slate-500"}>
          选择图标
        </span>
        <span aria-hidden className="text-xs text-slate-400">
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200">
          <div className="grid grid-cols-6 gap-1" role="listbox" aria-label="选择分类图标">
            {ICON_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === icon}
                onClick={() => {
                  setIcon(option);
                  setOpen(false);
                }}
                className={[
                  "grid h-9 w-9 place-items-center rounded-xl text-lg transition hover:bg-blue-50",
                  option === icon ? "bg-blue-50 ring-1 ring-blue-200" : "bg-white",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
