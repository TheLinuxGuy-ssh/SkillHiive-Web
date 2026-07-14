import React from "react";
import { useTokens } from "@/theme";
import { Surface, type SurfaceVariant } from "./Surface";

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  padding?: number;
  radius?: number;
  /** Render a hairline border. Defaults to true on solid; false on glass. */
  bordered?: boolean;
}

/**
 * Card — composes Surface with standard card padding and the 18px radius,
 * matching the mobile `Card`. Border is opt-in per variant.
 */
export function Card({
  variant = "solid",
  padding,
  radius,
  bordered,
  style,
  children,
  ...rest
}: CardProps) {
  const { spacing, radii, colors } = useTokens();
  const r = radius ?? radii.lg;
  const p = padding ?? spacing.base;
  const wantsBorder = bordered ?? variant !== "glass";

  return (
    <Surface
      variant={variant}
      radius={r}
      style={{
        padding: p,
        boxSizing: "border-box",
        ...(wantsBorder
          ? { border: `1px solid ${colors.border.subtle}` }
          : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Surface>
  );
}

export default Card;
