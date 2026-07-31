"use client";

import { useState, useTransition } from "react";
import { updateThemeColor } from "../actions";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";
import { THEME_PRESETS, type ThemeColor } from "@/lib/theme";

export function ThemeSettingsForm({ initialColor }: { initialColor: ThemeColor }) {
  const [color, setColor] = useState<ThemeColor>(initialColor);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSelect(next: ThemeColor) {
    if (next === color || pending) return;
    setColor(next);
    setError("");
    setSuccess(false);
    startTransition(async () => {
      try {
        await updateThemeColor(next);
        setSuccess(true);
      } catch (e) {
        if (isNextNavigationSignal(e)) throw e;
        setColor(color);
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {(Object.entries(THEME_PRESETS) as [ThemeColor, (typeof THEME_PRESETS)[ThemeColor]][]).map(
          ([key, preset]) => (
            <button
              key={key}
              type="button"
              disabled={pending}
              onClick={() => handleSelect(key)}
              title={preset.label}
              className={`flex flex-col items-center gap-1.5 disabled:opacity-60`}
            >
              <span
                className="h-9 w-9 rounded-full border-2 flex items-center justify-center"
                style={{
                  backgroundColor: preset.primary,
                  borderColor: color === key ? preset.primaryDark : "transparent",
                  boxShadow: color === key ? `0 0 0 2px ${preset.primaryDark}` : undefined,
                }}
              >
                {color === key && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <span className="text-[11px] text-gray-500">{preset.label}</span>
            </button>
          )
        )}
      </div>
      {error && <p className="text-sm text-brand-red">{error}</p>}
      {success && <p className="text-sm text-brand-green">Settings saved.</p>}
    </div>
  );
}
