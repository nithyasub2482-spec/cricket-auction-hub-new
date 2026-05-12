import { clsx } from "clsx";
import type { TimerState } from "@/hooks/useAuctionSocket";

interface CountdownTimerProps {
  timer: TimerState | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CountdownTimer({ timer, size = "md", className }: CountdownTimerProps) {
  if (!timer) return null;

  const { remaining, total, expired, paused } = timer;
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;

  const radius = size === "lg" ? 54 : size === "md" ? 36 : 22;
  const stroke = size === "lg" ? 6 : size === "md" ? 5 : 3;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * pct;
  const gap = circumference - dash;

  const svgSize = (radius + stroke) * 2 + 4;

  const urgent = remaining <= 10 && !paused && !expired;
  const warn = remaining <= 20 && remaining > 10 && !paused;

  const ringColor = expired
    ? "stroke-destructive"
    : paused
    ? "stroke-yellow-400"
    : urgent
    ? "stroke-destructive"
    : warn
    ? "stroke-amber-400"
    : "stroke-primary";

  const textColor = expired
    ? "text-destructive"
    : paused
    ? "text-yellow-400"
    : urgent
    ? "text-destructive"
    : warn
    ? "text-amber-400"
    : "text-foreground";

  const digits = size === "lg" ? "text-5xl" : size === "md" ? "text-2xl" : "text-sm";
  const label = size === "lg" ? "text-sm" : size === "md" ? "text-[10px]" : "hidden";

  return (
    <div className={clsx("flex flex-col items-center gap-1", className)}>
      <div className="relative flex items-center justify-center">
        <svg
          width={svgSize}
          height={svgSize}
          className={clsx("rotate-[-90deg]", urgent && !paused && !expired && "animate-pulse")}
        >
          {/* Background track */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-secondary"
          />
          {/* Progress arc */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            className={clsx("transition-all duration-1000", ringColor)}
          />
        </svg>

        {/* Center number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx("font-black font-mono tabular-nums", digits, textColor)}>
            {expired ? "0" : remaining}
          </span>
        </div>
      </div>

      {/* Label below */}
      <span className={clsx("uppercase font-bold tracking-widest text-muted-foreground", label)}>
        {expired ? "EXPIRED" : paused ? "PAUSED" : "SECONDS"}
      </span>
    </div>
  );
}
