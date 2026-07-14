import React, { createElement } from "react";
import { useTokens } from "@/theme";
import type { TypographyToken } from "@/theme";

type TextTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "inverse"
  | "tint"
  | "accent"
  | "danger"
  | "success"
  | "skillhive";

export interface TextProps
  extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyToken;
  tone?: TextTone;
  align?: React.CSSProperties["textAlign"];
  weight?: React.CSSProperties["fontWeight"];
  /** Render as a different element (h1, span, p…). Defaults to <span>. */
  as?: keyof React.JSX.IntrinsicElements;
  numberOfLines?: number;
}

/**
 * Themed typography primitive — mirror of the mobile `Text` component.
 * Applies a typography scale variant + semantic colour tone.
 */
export function Text({
  variant = "body",
  tone = "primary",
  align,
  weight,
  as = "span",
  numberOfLines,
  style,
  children,
  ...rest
}: TextProps) {
  const { typography, colors } = useTokens();
  const t = typography[variant] ?? typography.body;

  const toneMap: Record<TextTone, string> = {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    tertiary: colors.text.tertiary,
    inverse: colors.text.inverse,
    tint: colors.tint.primary,
    accent: colors.tint.accent,
    danger: colors.tint.danger,
    success: colors.tint.success,
    skillhive: colors.text.skillhive,
  };

  const clamp: React.CSSProperties =
    numberOfLines != null
      ? {
          display: "-webkit-box",
          WebkitLineClamp: numberOfLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }
      : {};

  return createElement(
    as,
    {
      style: {
        margin: 0,
        fontSize: t.size,
        lineHeight: `${t.lineHeight}px`,
        letterSpacing: t.letterSpacing,
        fontWeight: (weight ?? t.weight) as React.CSSProperties["fontWeight"],
        color: toneMap[tone],
        textAlign: align,
        ...clamp,
        ...style,
      } as React.CSSProperties,
      ...rest,
    },
    children,
  );
}

export default Text;
