"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// The V5/T3 form control: the reference's shadcn Input — h-9, a 12px
// radius (the reference's own remap computes its control radius to 12px;
// on our native scale the equivalent step is xl), a transparent
// background, and the border-input hairline. Call sites never fill it.

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm text-foreground transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
