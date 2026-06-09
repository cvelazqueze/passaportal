"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VisibilityToggleProps {
  visible: boolean;
  onToggle: (visible: boolean) => void;
  label: string;
  sublabel?: string;
  className?: string;
  size?: "sm" | "default";
}

export function VisibilityToggle({
  visible,
  onToggle,
  label,
  sublabel,
  className,
  size = "default",
}: VisibilityToggleProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const buttonSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 rounded-md px-1 py-0.5",
        !visible && "opacity-60",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm leading-snug",
            size === "sm" ? "font-normal" : "font-medium"
          )}
        >
          {label}
        </span>
        {sublabel && (
          <span className="block text-xs text-muted-foreground break-words">
            {sublabel}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          buttonSize,
          "shrink-0 rounded-full",
          visible
            ? "text-primary hover:bg-primary/10"
            : "text-muted-foreground hover:bg-muted"
        )}
        onClick={() => onToggle(!visible)}
        aria-pressed={visible}
        title={visible ? "Visible on resume" : "Hidden from resume"}
      >
        {visible ? (
          <Eye className={iconSize} />
        ) : (
          <EyeOff className={iconSize} />
        )}
      </Button>
    </div>
  );
}
