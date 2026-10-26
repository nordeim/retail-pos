"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/**
 * The h-2 slate-200 track with an sRGB-exact violet→indigo gradient fill
 * (the brand tile's own ramp, written as explicit stops per the v4 oklab
 * trap) and a 20px white/violet thumb. The old study-app fill element and
 * CSS vars never existed in globals.css.
 */
function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  // role="slider" is carried by the THUMB, so the accessible name must be
  // on the thumb — an aria-label parked on the root span never reaches it
  // (axe aria-input-field-name, serious).
  const { "aria-label": ariaLabel, ...rootProps } = props;
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        className,
      )}
      {...rootProps}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      >
        <SliderPrimitive.Range
          data-slot="slider-fill"
          className="absolute h-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, #8b5cf6, #4f46e5)",
          }}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        aria-label={ariaLabel}
        className="block size-5 rounded-full border-2 border-[#7f62f4] bg-white shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#7f62f4]/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  );
}

export { Slider };
