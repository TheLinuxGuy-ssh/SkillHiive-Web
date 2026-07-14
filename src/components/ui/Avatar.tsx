import React from "react";
import { useTokens, storyRingGradient } from "@/theme";
import { Text } from "./Text";

export interface AvatarProps {
  source?: string | null;
  /** Used to generate fallback initials when no image is available. */
  name?: string;
  size?: number;
  /** Solid ring around the avatar (verified profile, etc). */
  ringColor?: string;
  /** Instagram-style gradient story ring. */
  story?: boolean;
  storyViewed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

function initialsFor(name?: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

/**
 * Avatar primitive — mirror of the mobile `Avatar`. Optional gradient story
 * ring; initials fallback prevents layout shift while the image loads.
 */
export function Avatar({
  source,
  name,
  size = 44,
  ringColor,
  story,
  storyViewed,
  className,
  style,
  onClick,
}: AvatarProps) {
  const { colors } = useTokens();
  const trimmed = typeof source === "string" ? source.trim() : "";

  const ringPad = story ? 3 : ringColor ? 2 : 0;
  const innerSize = size - ringPad * 2;

  const inner = (
    <div
      style={{
        width: innerSize,
        height: innerSize,
        borderRadius: "50%",
        overflow: "hidden",
        background: colors.surface.secondary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: story
          ? `2px solid ${colors.bg.canvas}`
          : ringColor
            ? `2px solid ${ringColor}`
            : "none",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      {trimmed ? (
        <img
          src={trimmed}
          alt={name ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          draggable={false}
        />
      ) : (
        <Text
          tone="secondary"
          weight={700}
          style={{ fontSize: Math.max(12, size * 0.38), lineHeight: "1" }}
        >
          {initialsFor(name)}
        </Text>
      )}
    </div>
  );

  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: onClick ? "pointer" : undefined,
    ...style,
  };

  if (story) {
    return (
      <div className={className} style={wrapperStyle} onClick={onClick}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: storyViewed
              ? `linear-gradient(135deg, ${colors.border.strong}, ${colors.border.subtle})`
              : `linear-gradient(135deg, ${storyRingGradient[0]}, ${storyRingGradient[1]}, ${storyRingGradient[2]})`,
          }}
        >
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={wrapperStyle} onClick={onClick}>
      {inner}
    </div>
  );
}

export default Avatar;
