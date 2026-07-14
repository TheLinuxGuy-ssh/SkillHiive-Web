import SwipeLayout from "@/components/SwipeLayout";
import { Text } from "@/components/ui";
import NotificationList from "@/components/NotificationList";
import { useNotifications } from "@/hooks/useNotifications";
import { useTokens } from "@/theme";

const FONT =
  '"popreg", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export default function Notifications() {
  const { colors, spacing } = useTokens();
  const { pending, accepted, loading, acting, accept, decline, pendingCount } =
    useNotifications();

  return (
    <SwipeLayout>
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg.muted,
          paddingTop: 80,
          fontFamily: FONT,
        }}
      >
        <main
          style={{
            maxWidth: 640,
            width: "100%",
            margin: "0 auto",
            padding: `0 ${spacing.base}px 120px`,
          }}
        >
          {/* Header */}
          <div style={{ padding: `${spacing.lg}px 0 ${spacing.lg}px` }}>
            <Text
              variant="headline"
              weight={900}
              style={{ letterSpacing: -0.5 }}
            >
              Notifications
            </Text>
            <Text
              variant="caption"
              tone="tertiary"
              style={{
                display: "block",
                marginTop: 4,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {loading
                ? "…"
                : pendingCount > 0
                  ? `${pendingCount} pending`
                  : "all clear"}
            </Text>
          </div>

          <NotificationList
            pending={pending}
            accepted={accepted}
            loading={loading}
            acting={acting}
            accept={accept}
            decline={decline}
          />
        </main>
      </div>
    </SwipeLayout>
  );
}
