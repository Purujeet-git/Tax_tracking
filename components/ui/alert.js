import * as React from "react";
import { cn } from "@/lib/utils";

function Alert({ className, variant = "default", ...props }) {
  return (
    <div
      role="alert"
      className={cn(
        "relative grid w-full grid-cols-[auto_1fr] gap-x-3 rounded-md border-2 border-black bg-white p-4 text-sm text-black",
        variant === "destructive" && "border-black bg-[#ff5c5c] text-black",
        className
      )}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }) {
  return <h5 className={cn("font-black leading-none", className)} {...props} />;
}

function AlertDescription({ className, ...props }) {
  return <div className={cn("col-start-2 mt-1 font-semibold", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
