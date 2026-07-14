import React from "react";
import { useTokens } from "@/theme";

export type SurfaceVariant = "glass" | "solid" | "sunken" | "raised";

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  radius?: number;
}

/**
 * Themed surface primitive — mirror of the mobile `Surface`. Provides the
 * canonical background colour per elevation level, plus a frosted-glass
 * variant used by floating chrome (nav, sheets).
 */
export function Surface({
  variant = "solid",
  radius,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const { colors, mode, elevation } = useTokens();

  const base: React.CSSProperties = {
    borderRadius: radius,
  };

  if (variant === "glass") {
    return (
      <div
        style={{
          ...base,
          backgroundColor: colors.overlay.glassTint,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1px solid ${colors.border.subtle}`,
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  }

  const surfaceColor =
    variant === "sunken"
      ? colors.surface.sunken
      : variant === "raised"
        ? colors.surface.raised
        : colors.surface.primary;

  return (
    <div
      style={{
        ...base,
        backgroundColor: surfaceColor,
        boxShadow:
          variant === "raised"
            ? mode === "dark"
              ? "0 8px 24px rgba(0,0,0,0.5)"
              : elevation.md
            : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Surface;
