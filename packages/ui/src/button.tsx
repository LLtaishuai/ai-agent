import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "./lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-border-focus focus-visible:ring-[3px] focus-visible:ring-border-focus disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-border-error aria-invalid:ring-[3px] aria-invalid:ring-border-error/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand-500 text-content-primary hover:bg-brand-600",
        destructive:
          "bg-state-error text-content-primary hover:bg-state-error/90 focus-visible:ring-border-error/40",
        outline:
          "border border-border-default bg-surface-panel shadow-xs hover:bg-surface-elevated hover:text-content-primary",
        secondary:
          "bg-surface-elevated text-content-primary hover:bg-surface-elevated/80",
        ghost: "hover:bg-surface-elevated hover:text-content-primary",
        link: "text-brand-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
