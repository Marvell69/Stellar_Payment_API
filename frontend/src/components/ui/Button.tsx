import React from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

const BASE_CLASSES =
  "group relative flex items-center justify-center rounded-xl px-6 font-bold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-night";

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "h-12 bg-mint text-black hover:bg-glow",
  secondary:
    "h-12 border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white",
};

const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const variantClasses = VARIANT_CLASSES[variant];
    const showPrimaryGlow = variant === "primary";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${BASE_CLASSES} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Spinner
              size="sm"
              className={variant === "primary" ? "text-black" : "text-mint"}
            />
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
        {showPrimaryGlow && (
          <div className="absolute inset-0 -z-10 bg-mint/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
        )}
      </button>
    );
  },
);
ButtonBase.displayName = "Button";

export const Button = React.memo(ButtonBase);
Button.displayName = "Button";
