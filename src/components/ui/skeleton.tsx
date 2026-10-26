import { cn } from "@/lib/utils";

/** The loading placeholder (animate-pulse on the muted surface — the old
 * study-app shimmer utility never existed in globals.css). */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-white/5", className)}
      {...props}
    />
  );
}

export { Skeleton };
