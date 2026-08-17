import { HTMLAttributes } from "react";
import clsx from "clsx";

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-sm border border-line bg-white", className)}
      {...props}
    />
  );
}
