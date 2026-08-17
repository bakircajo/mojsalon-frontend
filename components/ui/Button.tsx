import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}

const variants: Record<string, string> = {
  primary: "bg-ink text-paper hover:bg-stub-dark",
  secondary: "bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper",
  ghost: "bg-transparent text-muted hover:text-ink",
  danger: "bg-transparent text-stub-dark border border-stub-dark hover:bg-stub-dark hover:text-paper",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "focus-ring inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
