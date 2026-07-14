import { useTokens } from "@/theme";
import { Text } from "./Text";

interface Props {
  title: string;
  subtitle?: string;
  /** Optional element rendered on the right (button, count chip…). */
  right?: React.ReactNode;
  sticky?: boolean;
}

/**
 * SectionHeader — mirror of the mobile `SectionHeader`. Small uppercase
 * caption title with optional right slot, on the muted canvas.
 */
export default function SectionHeader({ title, subtitle, right, sticky }: Props) {
  const { colors, spacing } = useTokens();

  return (
    <div
      style={{
        padding: `${spacing.md}px ${spacing.base}px`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: colors.bg.muted,
        position: sticky ? "sticky" : undefined,
        top: sticky ? 0 : undefined,
        zIndex: sticky ? 5 : undefined,
      }}
    >
      <Text
        variant="caption"
        style={{ textTransform: "uppercase" }}
      >
        {title}
      </Text>

      {right ??
        (subtitle ? (
          <Text variant="caption" tone="tertiary">
            {subtitle}
          </Text>
        ) : null)}
    </div>
  );
}
