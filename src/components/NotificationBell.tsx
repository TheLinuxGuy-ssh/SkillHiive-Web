import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Text } from "@/components/ui";
import NotificationList from "@/components/NotificationList";
import { useNotifications } from "@/hooks/useNotifications";
import { useTokens } from "@/theme";

export default function NotificationBell() {
  const { colors, radii, spacing } = useTokens();
  const navigate = useNavigate();
  const {
    pending,
    accepted,
    loading,
    acting,
    accept,
    decline,
    pendingCount,
    isAuthed,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!isAuthed) return null;

  return (
    <div ref={wrapRef} style={{ position: "relative" }} className="nav-block" >
      <button
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="transition-ui hover:scale-[1.025] active:scale-[1]"
        style={{
          position: "relative",
          width: 44,
          height: 44,
          borderRadius: 16,
          border: "none",
          background: open || hover ? "rgba(255,253,1,0.12)" : "transparent",
          color: open ? "#fffd01" : colors.text.primary,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s cubic-bezier(0.2,0.8,0.2,1)",
          transform: hover ? "scale(1.05)" : "scale(1)",
        }}
      >
        <Bell size={20} strokeWidth={2} fill={pendingCount > 0 ? "#fffd01" : "none"} color={pendingCount > 0 ? "#fffd01" : "currentColor"} />
        {pendingCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              minWidth: 16,
              height: 16,
              padding: pendingCount > 9 ? "0 4px" : 0,
              borderRadius: 8,
              background: "#fffd01",
              color: "#0f0f12",
              fontSize: 9,
              fontWeight: 800,
              lineHeight: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${colors.bg.muted}`,
            }}
          >
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              width: 340,
              maxWidth: "90vw",
              maxHeight: "70vh",
              overflowY: "auto",
              background: colors.bg.muted,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: radii.xl,
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              zIndex: 1000,
              fontFamily: '"popreg", system-ui, -apple-system, sans-serif',
            }}
          >
            {/* header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${spacing.md}px ${spacing.base}px`,
                borderBottom: `1px solid ${colors.border.subtle}`,
                position: "sticky",
                top: 0,
                background: colors.bg.muted,
              }}
            >
              <Text variant="subtitle" weight={800}>Notifications</Text>
              {pendingCount > 0 && (
                <div style={{ background: colors.surface.skillhive + "22", padding: "2px 8px", borderRadius: 999 }}>
                  <Text variant="caption" tone="skillhive" weight={700}>{pendingCount} pending</Text>
                </div>
              )}
            </div>

            <div style={{ padding: spacing.md }}>
              <NotificationList
                pending={pending}
                accepted={accepted}
                loading={loading}
                acting={acting}
                accept={accept}
                decline={decline}
                compact
                onNavigate={() => setOpen(false)}
              />
            </div>

            {/* footer */}
            <button
              onClick={() => { setOpen(false); navigate("/notifications"); }}
              style={{
                width: "100%",
                padding: `${spacing.md}px 0`,
                border: "none",
                borderTop: `1px solid ${colors.border.subtle}`,
                background: "transparent",
                color: colors.text.skillhive,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: 13,
                position: "sticky",
                bottom: 0,
              }}
            >
              See all notifications
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
