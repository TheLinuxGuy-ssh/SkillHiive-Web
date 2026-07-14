import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Swords, Check, X } from "lucide-react";
import SwipeLayout from "@/components/SwipeLayout";
import { Text } from "@/components/ui";
import { PostCard, type PostModel } from "@/components/feed/PostCards";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/profileContext";
import { useTokens } from "@/theme";

const FONT =
  '"popreg", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const PAGE_SIZE = 10;

type AllyStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted"
  | "loading";

type ViewedProfile = {
  id: string;
  username: string | null;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  displayname: string | null;
};

const FEED_QUERY = `
  id,
  user_id,
  post_type,
  caption,
  likes_count,
  comments_count,
  created_at,
  profiles:profiles!posts_user_id_profiles_fkey ( id, username, avatar ),
  project_posts:project_posts!project_posts_post_id_fkey ( title, description, started_at, ended_at, status ),
  offer_posts:offer_posts!offer_posts_post_id_fkey ( company, role, salary_range, location, offer_type ),
  post_images:post_images!post_images_post_id_fkey ( url, sort_order )
`;

export default function PublicProfile() {
  const params = useParams<{ id: string }>();
  const id = params.id!;
  const navigate = useNavigate();
  const { colors, spacing, radii } = useTokens();
  const { profile: myProfile } = useProfile();

  const [viewed, setViewed] = useState<ViewedProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [allyStatus, setAllyStatus] = useState<AllyStatus>("loading");
  const [actionLoading, setActionLoading] = useState(false);
  const [allyCount, setAllyCount] = useState(0);

  const [posts, setPosts] = useState<PostModel[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const isFetchingMore = useRef(false);

  // Redirect to own profile when viewing self
  useEffect(() => {
    if (id && myProfile?.id && id === myProfile.id) {
      navigate("/profile", { replace: true });
    }
  }, [id, myProfile?.id, navigate]);

  // Fetch profile
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar, banner, bio, displayname")
        .eq("id", id)
        .single();
      if (!error && data) setViewed(data as ViewedProfile);
      setLoadingProfile(false);
    })();
  }, [id]);

  // Ally count
  useEffect(() => {
    if (!id) return;
    void supabase
      .from("allies")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${id},receiver_id.eq.${id}`)
      .eq("status", "accepted")
      .then(({ count }) => setAllyCount(count ?? 0));
  }, [id]);

  // Ally status
  const fetchAllyStatus = useCallback(async () => {
    if (!id || !myProfile?.id) return;
    setAllyStatus("loading");
    const { data } = await supabase
      .from("allies")
      .select("id, requester_id, status")
      .or(
        `and(requester_id.eq.${myProfile.id},receiver_id.eq.${id}),and(requester_id.eq.${id},receiver_id.eq.${myProfile.id})`,
      )
      .maybeSingle();

    if (!data) {
      setAllyStatus("none");
      return;
    }
    if (data.status === "accepted") {
      setAllyStatus("accepted");
      return;
    }
    if (data.status === "pending") {
      setAllyStatus(
        data.requester_id === myProfile.id
          ? "pending_sent"
          : "pending_received",
      );
      return;
    }
    setAllyStatus("none");
  }, [id, myProfile?.id]);

  useEffect(() => {
    void fetchAllyStatus();
  }, [fetchAllyStatus]);

  // Posts
  const fetchUserPosts = useCallback(async () => {
    if (!id) return;
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from("posts")
      .select(FEED_QUERY)
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)
      .returns<PostModel[]>();
    if (!error && data) {
      setPosts(data);
      setHasMore(data.length === PAGE_SIZE);
      setCursor(data.length > 0 ? data[data.length - 1].created_at : null);
    }
    setLoadingPosts(false);
  }, [id]);

  const fetchMore = useCallback(async () => {
    if (!id || isFetchingMore.current || !hasMore || !cursor) return;
    isFetchingMore.current = true;
    const { data } = await supabase
      .from("posts")
      .select(FEED_QUERY)
      .eq("user_id", id)
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
  }, [id, cursor, hasMore]);

  useEffect(() => {
    void fetchUserPosts();
  }, [fetchUserPosts]);

  // Ally actions
  async function sendAllyRequest() {
    if (!myProfile?.id || !id) return;
    setActionLoading(true);
    const { error } = await supabase
      .from("allies")
      .insert({ requester_id: myProfile.id, receiver_id: id });
    if (!error) setAllyStatus("pending_sent");
    setActionLoading(false);
  }
  async function acceptAllyRequest() {
    if (!myProfile?.id || !id) return;
    setActionLoading(true);
    const { error } = await supabase
      .from("allies")
      .update({ status: "accepted" })
      .eq("requester_id", id)
      .eq("receiver_id", myProfile.id);
    if (!error) {
      setAllyStatus("accepted");
      setAllyCount((c) => c + 1);
    }
    setActionLoading(false);
  }
  async function withdrawRequest() {
    if (!myProfile?.id || !id) return;
    setActionLoading(true);
    await supabase
      .from("allies")
      .delete()
      .or(
        `and(requester_id.eq.${myProfile.id},receiver_id.eq.${id}),and(requester_id.eq.${id},receiver_id.eq.${myProfile.id})`,
      );
    setAllyStatus("none");
    setActionLoading(false);
  }

  const displayName = viewed?.displayname ?? "—";
  const R = radii.md;
  const SURFACE = colors.surface.secondary;
  const BORDER = colors.border.subtle;

  // Ally button
  function AllyButton() {
    const base: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "9px 16px",
      minWidth: 150,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 1.5,
      borderRadius: radii.pill,
      border: "none",
    };

    if (allyStatus === "loading") {
      return (
        <div
          style={{
            ...base,
            border: `1px solid ${BORDER}`,
            background: "transparent",
          }}
        >
          <MiniSpin />
        </div>
      );
    }
    if (allyStatus === "accepted") {
      return (
        <div
          style={{
            ...base,
            border: `1px solid ${BORDER}`,
            background: SURFACE,
            color: colors.text.tertiary,
          }}
        >
          ALLIED
        </div>
      );
    }
    if (allyStatus === "pending_sent") {
      return (
        <button
          onClick={withdrawRequest}
          disabled={actionLoading}
          style={{
            ...base,
            flexDirection: "column",
            gap: 1,
            border: `1px solid ${BORDER}`,
            background: SURFACE,
            color: colors.text.tertiary,
          }}
        >
          {actionLoading ? (
            <MiniSpin />
          ) : (
            <>
              <span>REQUEST SENT</span>
              <span
                style={{
                  fontSize: 8,
                  letterSpacing: 1,
                  color: colors.text.tertiary,
                }}
              >
                tap to cancel
              </span>
            </>
          )}
        </button>
      );
    }
    if (allyStatus === "pending_received") {
      return (
        <div style={{ display: "flex", gap: spacing.sm }}>
          <button
            onClick={acceptAllyRequest}
            disabled={actionLoading}
            style={{
              ...base,
              minWidth: 0,
              flex: 1,
              border: `1px solid ${colors.surface.skillhive}`,
              background: colors.bg.accentDim,
              color: colors.text.skillhive,
            }}
          >
            {actionLoading ? (
              <MiniSpin />
            ) : (
              <>
                <Check size={13} /> ACCEPT
              </>
            )}
          </button>
          <button
            onClick={withdrawRequest}
            disabled={actionLoading}
            style={{
              ...base,
              minWidth: 0,
              flex: 1,
              border: `1px solid ${BORDER}`,
              background: SURFACE,
              color: colors.text.tertiary,
            }}
          >
            <X size={13} /> DECLINE
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={sendAllyRequest}
        disabled={actionLoading}
        style={{
          ...base,
          border: `1px solid ${colors.surface.skillhive}`,
          background: colors.bg.accentDim,
          color: colors.text.skillhive,
        }}
      >
        {actionLoading ? (
          <MiniSpin />
        ) : (
          <>
            <Swords size={13} /> FORM ALLIANCE
          </>
        )}
      </button>
    );
  }

  if (loadingProfile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MiniSpin big />
      </div>
    );
  }
  if (!viewed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg.primary,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontFamily: FONT,
        }}
      >
        <Text tone="tertiary">User not found.</Text>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Text tone="tint" weight={600}>
            Go back
          </Text>
        </button>
      </div>
    );
  }

  return (
    <SwipeLayout>
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg.primary,
          paddingBottom: 120,
          fontFamily: FONT,
        }}
      >
        {/* Banner */}
        <div
          style={{
            position: "relative",
            height: 200,
            width: "100%",
            overflow: "hidden",
            background: colors.surface.secondary,
          }}
        >
          {viewed.banner ? (
            <img
              src={viewed.banner}
              alt=""
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
          <button
            onClick={() => navigate(-1)}
            style={{
              position: "absolute",
              top: 80,
              left: 16,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(0,0,0,0.45)",
              border: "none",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 999,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* Card */}
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: `0 ${spacing.base}px`,
          }}
        >
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
            {/* avatar + ally */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: -40,
                marginBottom: spacing.base,
                gap: spacing.sm,
                flexWrap: "wrap",
              }}
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
                  flexShrink: 0,
                }}
              >
                {viewed.avatar ? (
                  <img
                    src={viewed.avatar}
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
              </div>
              <AllyButton />
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
              {viewed.username && (
                <Text
                  tone="secondary"
                  style={{ fontFamily: "monospace", fontSize: 13 }}
                >
                  [{viewed.username}]
                </Text>
              )}
            </div>

            <Text
              variant="bodySm"
              tone="secondary"
              style={{ display: "block", marginBottom: spacing.lg }}
            >
              {viewed.bio ?? "No bio yet."}
            </Text>

            {/* stats */}
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

            {/* posts */}
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
                <MiniSpin big />
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
                    onOpen={(pid) => navigate(`/post/${pid}`)}
                  />
                ))}
                {hasMore && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      paddingTop: spacing.md,
                    }}
                  >
                    <button
                      onClick={() => void fetchMore()}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: colors.text.tertiary,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "inherit",
                      }}
                    >
                      load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </SwipeLayout>
  );
}

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

function MiniSpin({ big }: { big?: boolean }) {
  const { colors } = useTokens();
  const s = big ? 24 : 16;
  return (
    <>
      <style>{`@keyframes pub-spin { to { transform: rotate(360deg); } }`}</style>
      <span
        style={{
          width: s,
          height: s,
          border: `2px solid ${colors.border.subtle}`,
          borderTopColor: colors.surface.skillhive,
          borderRadius: "50%",
          display: "inline-block",
          animation: "pub-spin 0.8s linear infinite",
        }}
      />
    </>
  );
}
