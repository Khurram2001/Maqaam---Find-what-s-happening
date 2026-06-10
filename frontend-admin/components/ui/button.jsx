import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-[#0B4D53] text-white shadow-sm hover:bg-[#0B4D53]/90",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-[#0B4D53]/20 bg-white text-[#0B4D53] hover:bg-[#0B4D53]/5",
        ghost: "text-[#0B4D53]/80 hover:bg-[#0B4D53]/5",
        mint: "border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 text-[#0B4D53] hover:bg-[#2DD4BF]/20",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <ButtonPrimitive className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
