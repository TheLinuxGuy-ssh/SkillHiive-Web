import React, { useState } from "react";
import { useTokens } from "@/theme";
import { Text } from "./Text";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "accent";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
}

const HEIGHT: Record<ButtonSize, number> = { sm: 38, md: 46, lg: 54 };

/**
 * Button — mirror of the mobile `Button`: pill shape, variant colours,
 * spring-like press feedback (scale + opacity).
 */
export function Button({
  label,
  variant = "primary",
  size = "md",
  leading,
  trailing,
  fullWidth,
  loading,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors, radii, spacing, mode } = useTokens();
  const [pressed, setPressed] = useState(false);

  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";
  const isDanger = variant === "danger";
  const isAccent = variant === "accent";

  const bg = isPrimary
    ? colors.tint.primary
    : isAccent
      ? colors.tint.accent
      : isDanger
        ? colors.tint.danger
        : isSecondary
          ? colors.surface.secondary
          : "transparent";

  const fg =
    isPrimary || isDanger || isAccent
      ? isPrimary
        ? colors.text.onTint
        : colors.text.white
      : isGhost
        ? colors.tint.primary
        : colors.text.primary;

  const border =
    isSecondary && mode === "light"
      ? `1px solid ${colors.border.subtle}`
      : isGhost
        ? `1px solid ${colors.border.subtle}`
        : "none";

  const padX: Record<ButtonSize, number> = {
    sm: spacing.base,
    md: spacing.lg,
    lg: spacing.xl,
  };

  return (
    <button
      disabled={disabled || loading}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        height: HEIGHT[size],
        padding: `0 ${padX[size]}px`,
        borderRadius: radii.pill,
        background: bg,
        border,
        color: fg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        width: fullWidth ? "100%" : undefined,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "transform 0.12s cubic-bezier(0.2,0.8,0.2,1), opacity 0.12s",
        fontFamily: "inherit",
        outline: "none",
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <Spinner color={fg} />
      ) : (
        <>
          {leading}
          <Text
            variant={size === "lg" ? "subtitle" : "label"}
            style={{ color: fg }}
          >
            {label}
          </Text>
          {trailing}
        </>
      )}
    </button>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <>
      <style>{`@keyframes btn-spin { to { transform: rotate(360deg); } }`}</style>
      <span
        style={{
          width: 18,
          height: 18,
          border: `2px solid ${color}`,
          borderTopColor: "transparent",
          borderRadius: "50%",
          display: "inline-block",
          animation: "btn-spin 0.7s linear infinite",
        }}
      />
    </>
  );
}

export default Button;
