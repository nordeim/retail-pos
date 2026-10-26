"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// V5/H1: the study-app remnants are gone (those tokens never existed in
// globals.css). Real variants only:
//   · default   — the plain solid token button (violet, the brand primary);
//   · outline   — the dark-native outline (border-input, transparent);
//   · glass     — no utilities of its own: pairs with .glass-button*;
//   · destructive — red, for delete confirms;
//   · ghost / link — quiet affordances.
// The page's real CTAs do not use these variants — they compose the
// glass-button* utilities (see globals.css) at the call site, mirroring the
// reference's own layering.

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-violet-600 text-white shadow-sm hover:bg-violet-500",
        outline:
          "border border-input bg-transparent text-foreground hover:bg-white/5",
        // V6/F6: the glass channel — the .glass-button* utilities carry the
        // fill/hairline/text at the call site, so this variant ships NONE of
        // its own (the default's bg-violet-600/text-white and the outline's
        // bg-transparent were clobbering the flat glass fills).
        glass: "",
        destructive: "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        ghost: "hover:bg-white/5 hover:text-foreground",
        link: "text-violet-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
