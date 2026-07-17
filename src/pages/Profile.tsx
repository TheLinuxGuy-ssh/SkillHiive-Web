import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/profileContext";
import {
  Pen,
  LogOut,
  HelpCircle,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import SwipeLayout from "@/components/SwipeLayout";
import { Button, Text } from "@/components/ui";
import { PostCard, type PostModel } from "@/components/feed/PostCards";
import { useTokens } from "@/theme";
import { useTheme } from "@/components/theme-provider";

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

const PAGE_SIZE = 10;

const FEED_QUERY = `
  id,
  user_id,
  post_type,
  caption,
  likes_count,
  comments_count,
  created_at,
  profiles:profiles!posts_user_id_profiles_fkey (
    id,
    username,
    avatar
  ),
  project_posts:project_posts!project_posts_post_id_fkey (
    title,
    description,
    started_at,
    ended_at,
    status
  ),
  offer_posts:offer_posts!offer_posts_post_id_fkey (
    company,
    role,
    salary_range,
    location,
    offer_type
  ),
  post_images:post_images!post_images_post_id_fkey (
    url,
    sort_order
  )
`;

// ─────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate();
  const { profile, updateField } = useProfile();
  const { colors, spacing, radii } = useTokens();
  const { theme, setTheme } = useTheme();

  const [allyCount, setAllyCount] = useState(0);
  const [posts, setPosts] = useState<PostModel[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingAv, setUploadingAv] = useState(false);
  // const [uploadingBn, setUploadingBn] = useState(false);

  const isFetchingMore = useRef(false);
  const avInputRef = useRef<HTMLInputElement>(null);
  const bnInputRef = useRef<HTMLInputElement>(null);

  // ── ally count ──
  useEffect(() => {
    if (!profile?.id) return;
    void supabase
      .from("allies")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .eq("status", "accepted")
      .then(({ count }) => setAllyCount(count ?? 0));
  }, [profile?.id]);

  // ── fetch posts ──
  const fetchUserPosts = useCallback(
    async (isRefresh = false) => {
      const uid = profile?.id;
      if (!uid) return;
      if (!isRefresh) setLoadingPosts(true);

      const { data, error } = await supabase
        .from("posts")
        .select(FEED_QUERY)
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)
        .returns<PostModel[]>();

      if (!error && data) {
        setPosts(data);
        setHasMore(data.length === PAGE_SIZE);
        setCursor(data.length > 0 ? data[data.length - 1].created_at : null);
      }
      setLoadingPosts(false);
    },
    [profile?.id],
  );

  const fetchMore = useCallback(async () => {
    const uid = profile?.id;
    if (!uid || isFetchingMore.current || !hasMore || !cursor) return;
    isFetchingMore.current = true;

    const { data } = await supabase
      .from("posts")
      .select(FEED_QUERY)
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .lt("created_at", cursor)
      .limit(PAGE_SIZE)
      .returns<PostModel[]>();

    if (data) {
      setPosts((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setCursor(data.length > 0 ? data[data.length - 1].created_at : cursor);
    }
    isFetchingMore.current = false;
  }, [profile?.id, cursor, hasMore]);

  useEffect(() => {
    if (profile?.id) void fetchUserPosts();
  }, [profile?.id, fetchUserPosts]);

  // ── image upload ──
  async function uploadImage(file: File, type: "avatar" | "banner") {
    const uid = profile?.id;
    if (!uid) return;
    type === "avatar" ? setUploadingAv(true) : null;
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${uid}/${type}-${Date.now()}.${ext}`;
      const { data, error: uploadErr } = await supabase.storage
        .from("profile-images")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(data.path);
      await updateField(
        type === "avatar" ? "avatar" : "banner",
        urlData.publicUrl,
      );
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      type === "avatar" ? setUploadingAv(false) : null;
    }
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner",
  ) {
    const file = e.target.files?.[0];
    if (file) void uploadImage(file, type);
    e.target.value = "";
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate("/login");
  }

  const displayName = profile?.displayname ?? "—";
  const username = profile?.username ?? null;
  const bio = profile?.bio ?? "No bio yet.";

  const R = radii.md;
  const SURFACE = colors.surface.secondary;
  const BORDER = colors.border.subtle;

  return (
    <SwipeLayout>
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg.primary,
          paddingBottom: 120,
          fontFamily:
            '"popreg", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
        className="flex-col items-center"
      >
        {/* hidden file inputs */}
        <input
          ref={bnInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFileChange(e, "banner")}
        />
        <input
          ref={avInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFileChange(e, "avatar")}
        />

        {/* ── BANNER ── */}
        <div
          onClick={() => bnInputRef.current?.click()}
          style={{
            position: "relative",
                        maxWidth: 800,
            aspectRatio: "1000/350",
            cursor: "pointer",
            overflow: "hidden",
            background: colors.surface.secondary,
            margin: "0 auto",
          }}
          className="rounded-b-lg group"
        >
          {profile?.banner ? (
            <img
              src={profile.banner}
              alt="Banner"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: `linear-gradient(135deg, ${colors.surface.secondary}, ${colors.surface.skillhive}22, ${colors.surface.secondary})`,
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(10,10,10,0.35)",
            }}
          />
          <div
            className="opacity-0 group-hover:opacity-100"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.45)",
              transition: "opacity 150ms ease",
              pointerEvents: "none",
            }}
          >
            <Pen size={20} color="#fff" />
          </div>
        </div>

        {/* ── CARD ── */}
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: `0 ${spacing.base}px`,
            position: "relative",
          }}
        >
          <div className="absolute right-8 top-4">
            <Button
              label="Edit Profile"
              size="sm"
              icon={<Pen size={14} />}
              variant="primary"
              onClick={() => navigate("/settings/profile")}
            />
          </div>
          <div
            style={{
              background: colors.bg.muted,
              border: `1px solid ${BORDER}`,
              borderRadius: radii.xxl,
              marginTop: -24,
              marginBottom: spacing.xxl,
              padding: `0 ${spacing.lg}px ${spacing.xl}px`,
            }}
          >
            {/* avatar row */}
            <div
              style={{
                marginTop: -40,
                marginBottom: spacing.base,
              }}
              className="w-fit"
            >
              <div
                onClick={() => avInputRef.current?.click()}
                style={{ position: "relative", cursor: "pointer" }}
                className="group"
              >
                <div
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: 41,
                    border: `3px solid ${colors.bg.primary}`,
                    overflow: "hidden",
                    background: colors.surface.secondary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={displayName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Text variant="title" tone="skillhive" weight={900}>
                      {(displayName?.[0] ?? "?").toUpperCase()}
                    </Text>
                  )}
                  {uploadingAv && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 41,
                      }}
                    >
                      <MiniSpin light />
                    </div>
                  )}
                  <div
                    className="opacity-0 group-hover:opacity-100 rounded-full"
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.45)",
                      transition: "opacity 150ms ease",
                      pointerEvents: "none",
                    }}
                  >
                    <Pen size={18} color="#fff" />
                  </div>
                </div>
              </div>
            </div>

            {/* name + username */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: spacing.sm,
                marginBottom: spacing.xs,
              }}
            >
              <Text
                variant="headline"
                weight={900}
                style={{ letterSpacing: -0.5 }}
              >
                {displayName}
              </Text>
              {username && (
                <Text
                  tone="secondary"
                  style={{ fontFamily: "monospace", fontSize: 13 }}
                >
                  [{username}]
                </Text>
              )}
            </div>

            {/* bio */}
            <Text
              variant="bodySm"
              tone="secondary"
              style={{ display: "block", marginBottom: spacing.lg }}
            >
              {bio}
            </Text>

            {/* stats bar */}
            <div
              style={{
                display: "flex",
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: R,
                padding: "18px 0",
                marginBottom: spacing.xl,
              }}
            >
              <StatItem value={allyCount} label="Allied With" divider />
              <StatItem value={posts.length} label="Posts" />
            </div>

            {/* ── POSTS ── */}
            <div style={{ marginBottom: spacing.xl }}>
              <Text
                variant="subtitle"
                tone="skillhive"
                style={{
                  display: "block",
                  marginBottom: spacing.md,
                  letterSpacing: 1,
                }}
              >
                Posts
              </Text>

              {loadingPosts ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "40px 0",
                  }}
                >
                  <MiniSpin />
                </div>
              ) : posts.length === 0 ? (
                <Text
                  align="center"
                  tone="tertiary"
                  style={{ display: "block", padding: "40px 0" }}
                >
                  No posts yet.
                </Text>
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      hideAuthor
                      onOpen={(id) => navigate(`/post/${id}`)}
                    />
                  ))}

                  {hasMore &&
                    divider(
                      <button
                        onClick={() => void fetchMore()}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: colors.text.tertiary,
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "inherit",
                        }}
                      >
                        <ChevronDown size={13} />
                        load more
                      </button>,
                      colors.border.subtle,
                      spacing.base,
                    )}

                  {!hasMore &&
                    posts.length > 0 &&
                    divider(
                      <Text variant="caption" tone="tertiary">
                        all caught up
                      </Text>,
                      colors.border.subtle,
                      spacing.base,
                    )}
                </>
              )}
            </div>

            {/* ── PREFERENCES ── */}
            <div
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: R,
                padding: spacing.lg,
                display: "flex",
                flexDirection: "column",
                gap: spacing.base,
              }}
            >
              <Text
                variant="subtitle"
                tone="skillhive"
                style={{ letterSpacing: 1 }}
              >
                Preferences
              </Text>

              {/* theme toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="bodySm" tone="secondary">
                  Theme
                </Text>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    background: colors.overlay.press,
                    borderRadius: 10,
                    padding: 4,
                  }}
                >
                  {(
                    [
                      { value: "light", Icon: Sun },
                      { value: "dark", Icon: Moon },
                      { value: "system", Icon: Monitor },
                    ] as const
                  ).map(({ value, Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      title={value}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background:
                          theme === value
                            ? colors.surface.skillhive
                            : "transparent",
                        color:
                          theme === value
                            ? colors.text.onTint
                            : colors.text.tertiary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: BORDER }} />

              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 0,
                }}
              >
                <HelpCircle size={16} color={colors.text.tertiary} />
                <Text variant="bodySm" tone="secondary">
                  Help & Support
                </Text>
              </button>

              <div style={{ height: 1, background: BORDER }} />

              <button
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 0,
                  opacity: signingOut ? 0.5 : 1,
                }}
              >
                <LogOut size={16} color={colors.tint.danger} />
                <Text variant="bodySm" style={{ color: colors.tint.danger }}>
                  {signingOut ? "Logging out…" : "Logout"}
                </Text>
              </button>
            </div>

            <Text
              align="center"
              variant="caption"
              tone="tertiary"
              style={{
                display: "block",
                marginTop: spacing.lg,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              © SkillHiive
            </Text>
          </div>
        </div>
      </div>
    </SwipeLayout>
  );
}

// ─────────────────────────────────────────
// MINI COMPONENTS
// ─────────────────────────────────────────

function StatItem({
  value,
  label,
  divider,
}: {
  value: number | string;
  label: string;
  divider?: boolean;
}) {
  const { colors } = useTokens();
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        borderRight: divider ? `1px solid ${colors.border.subtle}` : "none",
      }}
    >
      <Text
        variant="title"
        tone="skillhive"
        weight={900}
        style={{ lineHeight: "1" }}
      >
        {value}
      </Text>
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
    </div>
  );
}

function divider(label: React.ReactNode, color: string, gap: number) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap, paddingTop: 16 }}>
      <div style={{ flex: 1, height: 1, background: color }} />
      {label}
      <div style={{ flex: 1, height: 1, background: color }} />
    </div>
  );
}

function MiniSpin({ light }: { light?: boolean }) {
  const { colors } = useTokens();
  return (
    <>
      <style>{`@keyframes prof-spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 18,
          height: 18,
          border: `2px solid ${light ? "rgba(255,255,255,0.3)" : colors.border.subtle}`,
          borderTopColor: light ? "#fff" : colors.surface.skillhive,
          borderRadius: "50%",
          animation: "prof-spin 0.8s linear infinite",
        }}
      />
    </>
  );
}