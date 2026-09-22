import * as React from "react";

import { cn } from "./lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-border-strong bg-surface-elevated/40 px-3 py-1 text-base text-content-primary shadow-xs transition-[color,box-shadow] outline-none selection:bg-brand-500 selection:text-content-primary file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-content-primary placeholder:text-content-tertiary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-border-focus focus-visible:ring-[3px] focus-visible:ring-border-focus",
        "aria-invalid:border-border-error aria-invalid:ring-[3px] aria-invalid:ring-border-error/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
