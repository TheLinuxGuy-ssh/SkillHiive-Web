import { MessageCircle } from "lucide-react";
import SwipeLayout from "@/components/SwipeLayout";
import { Text } from "@/components/ui";
import { useTokens } from "@/theme";

export default function Messages() {
  const { colors } = useTokens();
  return (
    <SwipeLayout>
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg.muted,
          paddingTop: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily:
            '"popreg", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            background: colors.surface.skillhive + "1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MessageCircle size={30} color={colors.surface.skillhive} />
        </div>
        <Text variant="title">Messages</Text>
        <Text
          variant="body"
          tone="tertiary"
          align="center"
          style={{ maxWidth: 320 }}
        >
          Direct messages are coming soon. For now, connect with allies through
          their profiles and the feed.
        </Text>
      </div>
    </SwipeLayout>
  );
}
