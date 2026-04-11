// src/app/components/ui/button.tsx 전체 교체
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  // 최신 트렌드: rounded-xl, 부드러운 전환(duration-200), 클릭 시 살짝 눌리는 쫀득한 효과(active:scale-[0.98])
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // 프리미엄 오렌지 색상과 은은한 그림자 효과
        default: "bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-md shadow-destructive/20",
        outline:
          "border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm hover:bg-slate-50 text-slate-700 dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 text-slate-600 dark:hover:bg-accent/50",
        link: "text-orange-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-2 has-[>svg]:px-4", // 모바일 터치를 고려해 기본 높이를 약간 키움
        sm: "h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-14 rounded-2xl px-8 text-base has-[>svg]:px-6",
        icon: "size-12 rounded-xl",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };