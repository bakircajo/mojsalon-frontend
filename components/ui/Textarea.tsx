import { TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={clsx(
            "focus-ring w-full rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60",
            error && "border-stub-dark",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-stub-dark">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
export default Textarea;
