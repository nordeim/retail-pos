"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// The V5/T3 + V11/F2 form control: the reference's shadcn Input — h-9,
// rounded-xl (12px), a transparent background, the border-input hairline,
// text-base with md:text-sm (the reference renders 16px under 768px — the
// iOS no-zoom size — and 14px above), a shadow-sm base, and the reference's
// OWN focus: ring-1 in the violet #7f62f4 (a 1px edge on the border, NO
// offset — NOT the shadcn ring-2 + 2px-offset halo the clone shipped
// through v10). Call sites never fill it.

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-base text-foreground shadow-sm transition-colors md:text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
