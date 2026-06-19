"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Password field with Maqaam teal show/hide toggle.
 */
export function PasswordInput({ className, id, disabled, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn(
          "w-full pr-10 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
        maxLength={16}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((show) => !show)}
        className={cn(
          "absolute inset-y-0 right-0 flex items-center pr-3 text-[#0B4D53] transition-colors",
          "hover:text-[#0B4D53]/75 focus-visible:rounded-r-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4D53]/30",
          disabled && "pointer-events-none opacity-40"
        )}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
      >
        {visible ? <EyeOff className="size-4 shrink-0" aria-hidden /> : <Eye className="size-4 shrink-0" aria-hidden />}
      </button>
    </div>
  );
}
