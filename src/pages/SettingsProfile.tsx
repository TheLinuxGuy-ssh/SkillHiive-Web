import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronRight,
  Mail,
  User,
  Type,
  Edit3,
  X,
  ArrowLeft,
} from "lucide-react";
import SwipeLayout from "@/components/SwipeLayout";
import { IconButton, Text } from "@/components/ui";
import { useProfile, type Profile } from "@/hooks/profileContext";
import { useTokens } from "@/theme";

const FONT =
  '"popreg", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

type FieldKey = keyof Omit<Profile, "id" | "created_at" | "email"> | "email";

interface FieldItem {
  key: FieldKey;
  Icon: React.FC<{ size?: number; color?: string }>;
  label: string;
  value: string;
  editable: boolean;
  multiline?: boolean;
}

export default function SettingsProfile() {
  const navigate = useNavigate();
  const { colors, spacing, radii } = useTokens();
  const { profile, loading, error, updateField } = useProfile();

  const [editing, setEditing] = useState<FieldItem | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const items: FieldItem[] = [
    {
      key: "email",
      Icon: Mail,
      label: "Email",
      value: profile?.email ?? "No email",
      editable: false,
    },
    {
      key: "username",
      Icon: User,
      label: "Username",
      value: profile?.username ?? "Not set",
      editable: true,
    },
    {
      key: "displayname",
      Icon: Type,
      label: "Display Name",
      value: profile?.displayname ?? "Not set",
      editable: true,
    },
    {
      key: "bio",
      Icon: Edit3,
      label: "Bio",
      value: profile?.bio ?? "No bio yet",
      editable: true,
      multiline: true,
    },
  ];

  function openEditor(item: FieldItem) {
    if (!item.editable) return;
    setEditing(item);
    setInputValue(
      item.value === "Not set" || item.value === "No bio yet" ? "" : item.value,
    );
  }

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 60);
  }, [editing]);

  async function handleSave() {
    if (!editing || editing.key === "email") return;
    setSaving(true);
    const ok = await updateField(editing.key, inputValue.trim());
    setSaving(false);
    if (ok) setEditing(null);
  }

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: `${spacing.sm}px 0 ${spacing.xl}px`,
            }}
          >
            <IconButton variant="primary" onClick={() => navigate(-1)} aria-label="Back">
              <ArrowLeft size={22} strokeWidth={2} />
            </IconButton>
            <Text variant="subtitle" weight={800}>
              Profile Edit
            </Text>
            <div style={{ width: 40 }} />
          </div>

          {loading && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "40px 0",
              }}
            >
              <Spinner />
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: 16,
                borderRadius: radii.md,
                background: colors.tint.danger + "1a",
                marginBottom: spacing.base,
              }}
            >
              <Text variant="bodySm" style={{ color: colors.tint.danger }}>
                {error}
              </Text>
            </div>
          )}

          {!loading && (
            <div
              style={{
                background: colors.surface.primary,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: radii.xxl,
                overflow: "hidden",
              }}
            >
              {items.map((item, i) => (
                <div
                  key={item.key}
                  onClick={() => openEditor(item)}
                  style={{
                    minHeight: 74,
                    padding: `0 ${spacing.base}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing.md,
                    borderBottom:
                      i !== items.length - 1
                        ? `1px solid ${colors.border.subtle}`
                        : "none",
                    cursor: item.editable ? "pointer" : "default",
                    opacity: item.editable ? 1 : 0.7,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: colors.surface.secondary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <item.Icon size={15} color={colors.text.primary} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text variant="bodySm" weight={700}>
                        {item.label}
                      </Text>
                      <Text
                        variant="caption"
                        tone="secondary"
                        numberOfLines={1}
                        style={{ display: "block", marginTop: 2 }}
                      >
                        {item.value}
                      </Text>
                    </div>
                  </div>
                  {item.editable && (
                    <ChevronRight size={18} color={colors.text.tertiary} />
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Edit modal */}
      {editing && (
        <div
          onClick={() => !saving && setEditing(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: colors.overlay.scrim,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.base,
            fontFamily: FONT,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              background: colors.bg.muted,
              borderRadius: radii.xxl,
              border: `1px solid ${colors.border.subtle}`,
              padding: spacing.xl,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: spacing.base,
              }}
            >
              <Text variant="subtitle" weight={800}>
                Edit {editing.label}
              </Text>
              <button
                onClick={() => setEditing(null)}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: colors.text.tertiary,
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !editing.multiline) {
                  e.preventDefault();
                  void handleSave();
                }
              }}
              rows={editing.multiline ? 4 : 1}
              placeholder={`Enter ${editing.label.toLowerCase()}…`}
              style={{
                width: "100%",
                background: colors.surface.secondary,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: radii.lg,
                padding: "12px 14px",
                fontSize: 15,
                color: colors.text.primary,
                outline: "none",
                resize: editing.multiline ? "vertical" : "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: spacing.sm,
                marginTop: spacing.lg,
              }}
            >
              <button
                onClick={() => setEditing(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: radii.pill,
                  border: `1px solid ${colors.border.subtle}`,
                  background: "transparent",
                  color: colors.text.secondary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "9px 20px",
                  borderRadius: radii.pill,
                  border: "none",
                  background: colors.surface.skillhive,
                  color: colors.text.onTint,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  fontFamily: "inherit",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SwipeLayout>
  );
}

function Spinner() {
  const { colors } = useTokens();
  return (
    <>
      <style>{`@keyframes set-spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 22,
          height: 22,
          border: `2px solid ${colors.border.subtle}`,
          borderTopColor: colors.surface.skillhive,
          borderRadius: "50%",
          animation: "set-spin 0.8s linear infinite",
        }}
      />
    </>
  );
}
