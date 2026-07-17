import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  ArrowLeft,
  Send,
  Trash2,
  Pencil,
  Check,
  X,
  MessageCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/profileContext";
import { useTokens } from "@/theme";
import { Text, Avatar, IconButton } from "@/components/ui";
import ActionRow from "@/components/ActionRow";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

type PostDetail = {
  id: string;
  user_id: string;
  post_type: "project" | "media" | "offer";
  caption: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: { id: string; username: string | null; avatar: string | null };
  project_posts: {
    title: string;
    description: string | null;
    started_at: string | null;
    ended_at: string | null;
    status: "active" | "completed" | "paused";
  } | null;
  offer_posts: {
    company: string | null;
    role: string | null;
    salary_range: string | null;
    location: string | null;
    offer_type: string | null;
  } | null;
  post_images: { url: string; sort_order: number }[] | null;
};

type Comment = {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  profiles: {
    id: string;
    username: string | null;
    avatar: string | null;
  } | null;
};

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function formatOfferType(raw: string | null): string {
  if (!raw) return "Offer";
  return raw.replace(/_/g, "-").replace(/\b\w/g, (c) => c.toUpperCase());
}

const POST_DETAIL_QUERY = `
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

const FONT =
  '"popreg", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// ─────────────────────────────────────────
// COMMENT ROW
// ─────────────────────────────────────────

function CommentRow({
  comment,
  currentUserId,
  onDelete,
  onOpenProfile,
}: {
  comment: Comment;
  currentUserId: string | null;
  onDelete: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  const { colors, spacing } = useTokens();
  const isOwn = comment.user_id === currentUserId;
  const name = comment.profiles?.username ?? "Unknown";
  const isReply = !!comment.parent_id;
  const authorId = comment.profiles?.id ?? comment.user_id;

  return (
    <div
      style={{
        marginLeft: isReply ? 32 : 0,
        display: "flex",
        gap: spacing.sm,
        marginBottom: spacing.md,
      }}
    >
      <div
        onClick={() => authorId && onOpenProfile(authorId)}
        style={{ cursor: authorId ? "pointer" : "default" }}
      >
        <Avatar name={name} source={comment.profiles?.avatar} size={30} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
            marginBottom: 3,
          }}
        >
          <span
            onClick={() => authorId && onOpenProfile(authorId)}
            style={{ cursor: authorId ? "pointer" : "default" }}
          >
            <Text variant="bodySm" weight={700}>
              {name}
            </Text>
          </span>
          <Text variant="caption" tone="tertiary">
            · {timeAgo(comment.created_at)}
          </Text>
        </div>
        <Text
          variant="body"
          tone="secondary"
          style={{ overflowWrap: "anywhere" }}
        >
          {comment.body}
        </Text>
      </div>
      {isOwn && (
        <button
          onClick={() => onDelete(comment.id)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: colors.text.tertiary,
            padding: 2,
            alignSelf: "flex-start",
          }}
          aria-label="Delete comment"
        >
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────

export default function Post() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, spacing, radii } = useTokens();
  const { profile: myProfile } = useProfile();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchAllRef = useRef<typeof fetchAll | null>(null);

  const isOwner = !!currentUserId && !!post && post.user_id === currentUserId;

  const openProfile = (uid: string) => {
    if (!uid) return;
    if (uid === myProfile?.id || uid === currentUserId) navigate("/profile");
    else navigate(`/profile/${uid}`);
  };

  const fetchAll = useCallback(async () => {
    setError(null);
    const [
      {
        data: { user },
      },
      postRes,
      commentsRes,
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("posts")
        .select(POST_DETAIL_QUERY)
        .eq("id", postId)
        .single(),
      supabase
        .from("comments")
        .select(
          "id, body, created_at, parent_id, user_id, profiles:profiles(id, username, avatar)",
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true }),
    ]);

    setCurrentUserId(user?.id ?? null);

    if (postRes.error) {
      setError("Couldn't load post.");
    } else {
      const raw = postRes.data as any;
      const normalized: PostDetail = {
        ...raw,
        profiles: Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles,
        project_posts: Array.isArray(raw.project_posts)
          ? raw.project_posts[0]
          : raw.project_posts,
        offer_posts: Array.isArray(raw.offer_posts)
          ? raw.offer_posts[0]
          : raw.offer_posts,
      };
      setPost(normalized);
      setEditCaption(normalized.caption ?? "");
      if (normalized.project_posts) {
        setEditTitle(normalized.project_posts.title ?? "");
        setEditDesc(normalized.project_posts.description ?? "");
      }
    }

    setComments((commentsRes.data as unknown as Comment[]) ?? []);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchAllRef.current = fetchAll;
  }, [fetchAll]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  // poll every 8s
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchAllRef.current?.();
    }, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // auto-focus comment input when arriving via the comment button
  useEffect(() => {
    if (loading) return;
    if ((location.state as any)?.focusComment) {
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 120);
      return () => clearTimeout(t);
    }
  }, [loading, location.state]);

  async function submitComment() {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      body: commentText.trim(),
      parent_id: replyTo?.id ?? null,
    });

    if (!error) {
      setCommentText("");
      setReplyTo(null);
      await fetchAllRef.current?.();
      inputRef.current?.blur();
    }
    setSubmitting(false);
  }

  async function deleteComment(id: string) {
    if (!window.confirm("Delete this comment?")) return;
    await supabase.from("comments").delete().eq("id", id);
    await fetchAllRef.current?.();
  }

  async function deletePost() {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    await supabase.from("posts").delete().eq("id", postId);
    navigate(-1);
  }

  async function saveEdits() {
    if (!post || saving) return;
    setSaving(true);
    await supabase
      .from("posts")
      .update({ caption: editCaption.trim() || null })
      .eq("id", postId);
    if (post.post_type === "project") {
      await supabase
        .from("project_posts")
        .update({
          title: editTitle.trim(),
          description: editDesc.trim() || null,
        })
        .eq("post_id", postId);
    }
    setSaving(false);
    setEditing(false);
    await fetchAllRef.current?.();
  }

  // ── loading / error ──
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg.muted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner />
      </div>
    );
  }
  if (error || !post) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg.muted,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontFamily: FONT,
        }}
      >
        <Text tone="tertiary">{error ?? "Post not found."}</Text>
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

  const pp = post.project_posts;
  const op = post.offer_posts;
  const img = [...(post.post_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  )[0];
  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => !!c.parent_id);

  // const headerTitle =
  //   post.post_type === "project" && pp
  //     ? pp.title
  //     : post.post_type === "offer" && op
  //       ? (op.role ?? "Offer")
  //       : "Post";

  const editField: React.CSSProperties = {
    width: "100%",
    background: colors.surface.secondary,
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: radii.lg,
    padding: "12px",
    color: colors.text.primary,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: 15,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg.muted,
        fontFamily: FONT,
        padding: "24px 20px",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "end",
          gap: spacing.sm,
          padding: `${spacing.md}px ${spacing.base}px`,
          background: colors.bg.muted,
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        {isOwner && !editing && (
          <div
            style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}
          >
            <button
              onClick={() => setEditing(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: colors.surface.secondary,
                border: "none",
                padding: "6px 10px",
                borderRadius: 999,
                cursor: "pointer",
                color: colors.text.secondary,
                fontFamily: "inherit",
              }}
            >
              <Pencil size={13} strokeWidth={2} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Edit</span>
            </button>
            <button
              onClick={deletePost}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(239,68,68,0.08)",
                border: "none",
                padding: "6px 10px",
                borderRadius: 999,
                cursor: "pointer",
                color: "#ef4444",
                fontFamily: "inherit",
              }}
            >
              <Trash2 size={13} strokeWidth={2} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Delete</span>
            </button>
          </div>
        )}

        {isOwner && editing && (
          <div style={{ display: "flex", gap: spacing.sm }}>
            <button
              onClick={() => setEditing(false)}
              aria-label="Cancel"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: colors.surface.secondary,
                border: "none",
                cursor: "pointer",
                color: colors.text.tertiary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={15} strokeWidth={2.5} />
            </button>
            <button
              onClick={saveEdits}
              disabled={saving}
              aria-label="Save"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: colors.tint.primary,
                border: "none",
                cursor: "pointer",
                color: colors.text.onTint,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {saving ? <MiniSpin /> : <Check size={15} strokeWidth={2.5} />}
            </button>
          </div>
        )}
      </div>

      {/* ── BODY ── */}
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: `${spacing.base}px ${spacing.base}px 140px`,
        }}
      >
        {/* Author row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          <div
            onClick={() => openProfile(post.user_id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.sm,
              flex: 1,
              minWidth: 0,
              cursor: "pointer",
            }}
          >
            <IconButton variant="primary" onClick={() => navigate(-1)} aria-label="Back">
              <ArrowLeft size={22} strokeWidth={2} />
            </IconButton>
            <div
            style={{
              background:
                post.post_type === "offer"
                  ? colors.tint.success + "22"
                  : colors.surface.skillhive + "18",
              padding: "5px 8px",
              borderRadius: 999,
            }}
            className="mr-auto"
          >
            <Text
              variant="caption"
              weight={700}
              style={{
                color:
                  post.post_type === "offer"
                    ? colors.tint.success
                    : colors.surface.skillhive,
              }}
            >
              {post.post_type === "offer"
                ? "Offer"
                : post.post_type === "project"
                  ? "Project"
                  : "Media"}
            </Text>
          </div>
            <div className="text-right" style={{ minWidth: 0 }}>
              <Text
                variant="bodySm"
                tone="secondary"
                weight={600}
                numberOfLines={1}
              >
                {post.profiles?.username ?? "Unknown"}
              </Text>
              <Text variant="caption" tone="tertiary" style={{ marginTop: 0 }}>
                {timeAgo(post.created_at)}
              </Text>
            </div>
            <Avatar
              name={post.profiles?.username ?? "?"}
              source={post.profiles?.avatar}
              className="ml-1"
            />
          </div>
        </div>

        {/* PROJECT body */}
        {post.post_type === "project" && pp && (
          <>
            {editing ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: spacing.sm,
                  marginBottom: spacing.md,
                }}
              >
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Project title"
                  style={{ ...editField, fontWeight: 700, fontSize: 17 }}
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description"
                  rows={4}
                  style={{ ...editField, resize: "vertical", lineHeight: 1.5 }}
                />
              </div>
            ) : (
              <>
                <Text
                  variant="title"
                  weight={800}
                  style={{ display: "block", marginBottom: spacing.xs }}
                >
                  {pp.title}
                </Text>
                {(pp.started_at || pp.ended_at) && (
                  <Text
                    variant="bodySm"
                    tone="tertiary"
                    style={{ display: "block", marginBottom: spacing.md }}
                  >
                    {pp.started_at ? formatDate(pp.started_at) : "?"} →{" "}
                    {pp.ended_at ? formatDate(pp.ended_at) : "Present"}
                  </Text>
                )}
                {!!pp.description && (
                  <Text
                    variant="body"
                    tone="secondary"
                    style={{ display: "block", marginBottom: spacing.md }}
                  >
                    {pp.description}
                  </Text>
                )}
              </>
            )}

            {!!img?.url && (
              <div
                style={{
                  position: "relative",
                  borderRadius: radii.xl,
                  overflow: "hidden",
                  marginBottom: spacing.md,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: spacing.sm,
                    right: spacing.sm,
                    zIndex: 1,
                    background:
                      pp.status === "active"
                        ? "rgba(34,197,94,0.15)"
                        : pp.status === "completed"
                          ? "rgba(59,130,246,0.15)"
                          : "rgba(245,158,11,0.15)",
                    padding: "4px 8px",
                    borderRadius: 999,
                  }}
                >
                  <Text
                    variant="caption"
                    weight={700}
                    style={{
                      color:
                        pp.status === "active"
                          ? "#22c55e"
                          : pp.status === "completed"
                            ? "#3b82f6"
                            : "#f59e0b",
                    }}
                  >
                    {pp.status.charAt(0).toUpperCase() + pp.status.slice(1)}
                  </Text>
                </div>
                <img
                  src={img.url}
                  alt={pp.title}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "75vh",
                    objectFit: "contain",
                    display: "block",
                    background: colors.surface.secondary,
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* OFFER body */}
        {post.post_type === "offer" && op && (
          <div
            style={{
              background: colors.surface.secondary,
              borderRadius: radii.xl,
              padding: spacing.base,
              marginBottom: spacing.md,
            }}
          >
            {!!op.company && (
              <Text
                variant="caption"
                weight={700}
                style={{
                  color: colors.tint.success,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {op.company}
              </Text>
            )}
            <Text
              variant="title"
              weight={800}
              style={{
                display: "block",
                marginTop: op.company ? spacing.xs : 0,
              }}
            >
              {op.role ?? "Role TBD"}
            </Text>
            {(op.salary_range || op.location) && (
              <Text
                variant="bodySm"
                tone="secondary"
                style={{ display: "block", marginTop: spacing.xs }}
              >
                {[op.salary_range, op.location].filter(Boolean).join(" · ")}
              </Text>
            )}
            {!!op.offer_type && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: spacing.sm,
                }}
              >
                <div
                  style={{
                    background: colors.tint.success + "22",
                    padding: "4px 8px",
                    borderRadius: 999,
                  }}
                >
                  <Text
                    variant="caption"
                    weight={700}
                    style={{ color: colors.tint.success }}
                  >
                    {formatOfferType(op.offer_type)}
                  </Text>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MEDIA body */}
        {post.post_type === "media" && !!img?.url && (
          <img
            src={img.url}
            alt=""
            style={{
              width: "100%",
              borderRadius: radii.xl,
              marginBottom: spacing.md,
              objectFit: "cover",
              display: "block",
            }}
          />
        )}

        {/* Caption */}
        {editing ? (
          <textarea
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            placeholder="Caption…"
            maxLength={500}
            rows={3}
            style={{
              ...editField,
              resize: "vertical",
              lineHeight: 1.5,
              marginBottom: spacing.md,
            }}
          />
        ) : (
          !!post.caption && (
            <Text
              variant="body"
              tone="secondary"
              style={{ display: "block", marginBottom: spacing.md }}
            >
              {post.caption}
            </Text>
          )
        )}

        {/* Stats / actions */}
        <div
          style={{
            borderTop: `1px solid ${colors.border.subtle}`,
            borderBottom: `1px solid ${colors.border.subtle}`,
            marginBottom: spacing.lg,
          }}
        >
          <ActionRow
            postId={post.id}
            likes={post.likes_count}
            comments={post.comments_count}
            noborder
            onCommentPress={() => inputRef.current?.focus()}
          />
        </div>

        {/* Comments */}
        <Text
          variant="body"
          weight={700}
          style={{ display: "block", marginBottom: spacing.md }}
        >
          Comments
        </Text>

        {topLevel.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: spacing.sm,
              padding: `${spacing.xl}px 0`,
            }}
          >
            <MessageCircle
              size={32}
              color={colors.text.tertiary}
              strokeWidth={1.4}
            />
            <Text variant="bodySm" tone="tertiary">
              No comments yet. Be the first.
            </Text>
          </div>
        ) : (
          topLevel.map((c) => (
            <div key={c.id}>
              <CommentRow
                comment={c}
                currentUserId={currentUserId}
                onDelete={deleteComment}
                onOpenProfile={openProfile}
              />
              {replies
                .filter((r) => r.parent_id === c.id)
                .map((r) => (
                  <CommentRow
                    key={r.id}
                    comment={r}
                    currentUserId={currentUserId}
                    onDelete={deleteComment}
                    onOpenProfile={openProfile}
                  />
                ))}
              <button
                onClick={() => {
                  setReplyTo(c);
                  inputRef.current?.focus();
                }}
                style={{
                  marginLeft: 42,
                  marginBottom: spacing.md,
                  marginTop: -spacing.xs,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: colors.text.tertiary,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Reply
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── COMMENT INPUT (fixed, lifted) ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: `1px solid ${colors.border.subtle}`,
          background: colors.bg.elevated,
          padding: `${spacing.sm}px ${spacing.base}px ${spacing.md}px`,
          zIndex: 20,
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {!!replyTo && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.sm,
                background: colors.surface.secondary,
                borderRadius: radii.lg,
                padding: "6px 10px",
                marginBottom: spacing.sm,
              }}
            >
              <Text
                variant="caption"
                tone="tertiary"
                numberOfLines={1}
                style={{ flex: 1 }}
              >
                Replying to{" "}
                <b style={{ color: colors.text.secondary }}>
                  {replyTo.profiles?.username ?? "someone"}
                </b>
              </Text>
              <button
                onClick={() => setReplyTo(null)}
                aria-label="Cancel reply"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: colors.text.tertiary,
                  display: "flex",
                }}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
          )}

          <div
            style={{ display: "flex", gap: spacing.sm, alignItems: "flex-end" }}
          >
            <textarea
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submitComment();
                }
              }}
              placeholder="Write a comment…"
              maxLength={2000}
              rows={1}
              style={{
                flex: 1,
                background: colors.surface.secondary,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: radii.xl,
                padding: "10px 14px",
                color: colors.text.primary,
                fontSize: 15,
                outline: "none",
                resize: "none",
                maxHeight: 100,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={submitComment}
              disabled={!commentText.trim() || submitting}
              aria-label="Send comment"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: "none",
                cursor:
                  commentText.trim() && !submitting ? "pointer" : "not-allowed",
                background: commentText.trim()
                  ? colors.tint.primary
                  : colors.surface.secondary,
                color: commentText.trim()
                  ? colors.text.onTint
                  : colors.text.tertiary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {submitting ? <MiniSpin /> : <Send size={16} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  const { colors } = useTokens();
  return (
    <>
      <style>{`@keyframes post-spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 24,
          height: 24,
          border: `2px solid ${colors.border.subtle}`,
          borderTopColor: colors.surface.skillhive,
          borderRadius: "50%",
          animation: "post-spin 0.8s linear infinite",
        }}
      />
    </>
  );
}

function MiniSpin() {
  return (
    <>
      <style>{`@keyframes post-mini-spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 16,
          height: 16,
          border: "2px solid rgba(0,0,0,0.25)",
          borderTopColor: "#000",
          borderRadius: "50%",
          animation: "post-mini-spin 0.7s linear infinite",
        }}
      />
    </>
  );
}
