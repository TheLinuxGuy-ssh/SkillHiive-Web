import { useNavigate } from "react-router";
import { Swords, Check, X, UserCheck, BellOff } from "lucide-react";
import { Text, Avatar } from "@/components/ui";
import { useTokens } from "@/theme";
import type { AllyRequest } from "@/hooks/useNotifications";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface Props {
  pending: AllyRequest[];
  accepted: AllyRequest[];
  loading: boolean;
  acting: string | null;
  accept: (req: AllyRequest) => void;
  decline: (req: AllyRequest) => void;
  /** compact = dropdown variant (denser, no page padding). */
  compact?: boolean;
  /** called after navigating to a profile (e.g. to close the dropdown). */
  onNavigate?: () => void;
}

export default function NotificationList({
  pending,
  accepted,
  loading,
  acting,
  accept,
  decline,
  compact,
  onNavigate,
}: Props) {
  const { colors, spacing, radii } = useTokens();
  const navigate = useNavigate();

  const goProfile = (id: string) => {
    onNavigate?.();
    navigate(`/profile/${id}`);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <Spinner />
      </div>
    );
  }

  if (pending.length === 0 && accepted.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.sm, padding: `${compact ? 32 : 64}px ${spacing.base}px` }}>
        <BellOff size={compact ? 26 : 32} color={colors.text.tertiary} strokeWidth={1.5} />
        <Text variant="bodySm" tone="tertiary">No notifications yet.</Text>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      {/* Pending alliance requests */}
      {pending.length > 0 && (
        <>
          <Text variant="caption" tone="skillhive" weight={800} style={{ textTransform: "uppercase", letterSpacing: 1.2, padding: `${spacing.xs}px ${spacing.xxs}px` }}>
            Alliance Requests
          </Text>
          {pending.map((req) => (
            <div
              key={req.id}
              style={{
                border: `1px solid ${colors.surface.skillhive}55`,
                borderRadius: radii.lg,
                overflow: "hidden",
                background: colors.surface.primary,
              }}
            >
              <div
                onClick={() => goProfile(req.requester.id)}
                style={{ display: "flex", alignItems: "center", gap: spacing.md, padding: spacing.md, cursor: "pointer" }}
              >
                <Avatar name={req.requester.displayname ?? "?"} source={req.requester.avatar} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodySm" weight={800} numberOfLines={1}>
                    {req.requester.displayname ?? "Unknown"}
                  </Text>
                  {req.requester.username && (
                    <Text variant="caption" tone="secondary" style={{ fontFamily: "monospace" }}>
                      [{req.requester.username}]
                    </Text>
                  )}
                  <Text variant="caption" tone="tertiary" style={{ display: "block", marginTop: 2 }}>
                    {timeAgo(req.created_at)}
                  </Text>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: colors.bg.accentDim, border: `1px solid ${colors.surface.skillhive}`, padding: "4px 8px", borderRadius: 999, flexShrink: 0 }}>
                  <Swords size={11} color={colors.text.skillhive} />
                  <Text variant="caption" weight={800} style={{ color: colors.text.skillhive, letterSpacing: 0.5 }}>
                    Request
                  </Text>
                </div>
              </div>

              <div style={{ display: "flex", borderTop: `1px solid ${colors.border.subtle}` }}>
                <button
                  onClick={() => accept(req)}
                  disabled={acting === req.id}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", border: "none", borderRight: `1px solid ${colors.border.subtle}`, background: colors.bg.accentDim, color: colors.text.skillhive, cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 12, letterSpacing: 0.5 }}
                >
                  {acting === req.id ? <Spinner small /> : <><Check size={14} /> Accept</>}
                </button>
                <button
                  onClick={() => decline(req)}
                  disabled={acting === req.id}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", border: "none", background: colors.surface.secondary, color: colors.text.tertiary, cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 12, letterSpacing: 0.5 }}
                >
                  <X size={14} /> Decline
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Accepted allies */}
      {accepted.length > 0 && (
        <>
          <Text variant="caption" tone="tertiary" weight={800} style={{ textTransform: "uppercase", letterSpacing: 1.2, padding: `${spacing.xs}px ${spacing.xxs}px`, marginTop: pending.length > 0 ? spacing.sm : 0 }}>
            Recent Allies
          </Text>
          {accepted.map((req) => (
            <div
              key={req.id}
              onClick={() => goProfile(req.requester.id)}
              style={{ display: "flex", alignItems: "center", gap: spacing.md, padding: spacing.md, border: `1px solid ${colors.border.subtle}`, borderRadius: radii.lg, background: colors.surface.primary, cursor: "pointer" }}
            >
              <Avatar name={req.requester.displayname ?? "?"} source={req.requester.avatar} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text variant="bodySm" weight={800} numberOfLines={1}>
                  {req.requester.displayname ?? "Unknown"}
                </Text>
                {req.requester.username && (
                  <Text variant="caption" tone="secondary" style={{ fontFamily: "monospace" }}>
                    [{req.requester.username}]
                  </Text>
                )}
                <Text variant="caption" tone="tertiary" style={{ display: "block", marginTop: 2 }}>
                  {timeAgo(req.created_at)}
                </Text>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: colors.surface.secondary, border: `1px solid ${colors.border.subtle}`, padding: "4px 8px", borderRadius: 999, flexShrink: 0 }}>
                <UserCheck size={11} color={colors.text.tertiary} />
                <Text variant="caption" weight={800} tone="tertiary" style={{ letterSpacing: 0.5 }}>
                  Allied
                </Text>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function Spinner({ small }: { small?: boolean }) {
  const { colors } = useTokens();
  const s = small ? 14 : 22;
  return (
    <>
      <style>{`@keyframes notif-spin { to { transform: rotate(360deg); } }`}</style>
      <span
        style={{
          width: s,
          height: s,
          border: `2px solid ${small ? colors.surface.skillhive + "55" : colors.border.subtle}`,
          borderTopColor: colors.surface.skillhive,
          borderRadius: "50%",
          display: "inline-block",
          animation: "notif-spin 0.8s linear infinite",
        }}
      />
    </>
  );
}
