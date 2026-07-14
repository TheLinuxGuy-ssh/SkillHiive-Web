import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Avatar, Text } from "@/components/ui";
import ActionRow from "@/components/ActionRow";
import { useTokens } from "@/theme";

// ─────────────────────────────────────────
// Shared post model (superset of Feed + Profile queries)
// ─────────────────────────────────────────

export type ProjectStatus = "active" | "completed" | "paused";

export interface PostModel {
  id: string;
  user_id?: string;
  post_type: "project" | "media" | "offer";
  caption: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: {
    id?: string;
    username: string | null;
    avatar: string | null;
  } | null;
  project_posts: {
    title: string;
    description: string | null;
    started_at: string | null;
    ended_at: string | null;
    status: ProjectStatus;
  } | null;
  offer_posts: {
    company: string | null;
    role: string | null;
    salary_range: string | null;
    location: string | null;
    offer_type: string | null;
  } | null;
  post_images: { url: string; sort_order: number }[] | null;
}

const STATUS_CFG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  completed: { label: "Completed", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  paused:    { label: "Paused",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

const OFFER_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  contract: "Contract",
};

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function calcDuration(s: string | null, e: string | null): string | null {
  if (!s) return null;
  const ms = (e ? new Date(e) : new Date()).getTime() - new Date(s).getTime();
  const mo = Math.round(ms / (1000 * 60 * 60 * 24 * 30));
  if (mo < 1)  return "< 1 mo";
  if (mo < 12) return `${mo} mo`;
  const y = Math.floor(mo / 12), r = mo % 12;
  return r ? `${y} yr ${r} mo` : `${y} yr`;
}

// ─────────────────────────────────────────
// FeedCard — mirror of mobile FeedCard.tsx
// ─────────────────────────────────────────

export function FeedCard({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) {
  const { colors, radii, spacing } = useTokens();
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onPress}
      onMouseDown={() => onPress && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        background: colors.surface.primary,
        borderRadius: radii.xl,
        border: `1px solid ${colors.border.subtle}`,
        overflow: "hidden",
        marginBottom: spacing.md,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        cursor: onPress ? "pointer" : "default",
        opacity: pressed ? 0.92 : 1,
        transition: "opacity 0.12s",
      }}
    >
      {children}
    </div>
  );
}

function AuthorRow({
  post,
  myId,
  badge,
  badgeColor,
  badgeBg,
}: {
  post: PostModel;
  myId: string | null;
  badge: string;
  badgeColor: string;
  badgeBg: string;
}) {
  const { spacing } = useTokens();
  const navigate = useNavigate();
  const name = post.profiles?.username ?? "unknown";
  const authorId = post.profiles?.id ?? post.user_id;

  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: spacing.sm }}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (!authorId) return;
          if (authorId === myId) navigate("/profile");
          else navigate(`/profile/${authorId}`);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          minWidth: 0,
          gap: spacing.sm,
          cursor: authorId ? "pointer" : "default",
        }}
      >
        <Avatar name={name} source={post.profiles?.avatar} size={32} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text variant="bodySm" tone="secondary" weight={600} numberOfLines={1}>
            {name}
          </Text>
          <Text variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
            {timeAgo(post.created_at)}
          </Text>
        </div>
      </div>
      <div style={{ background: badgeBg, padding: `${spacing.xs}px ${spacing.sm}px`, borderRadius: 999, flexShrink: 0 }}>
        <Text variant="caption" weight={700} style={{ color: badgeColor }}>
          {badge}
        </Text>
      </div>
    </div>
  );
}

// A compact type badge + timestamp header used when the author is hidden
// (e.g. on your own profile), mirroring the mobile profile cards.
function BadgeRow({
  post,
  badge,
  badgeColor,
  badgeBg,
}: {
  post: PostModel;
  badge: string;
  badgeColor: string;
  badgeBg: string;
}) {
  const { spacing } = useTokens();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
      <div style={{ background: badgeBg, padding: `${spacing.xs}px ${spacing.sm}px`, borderRadius: 999 }}>
        <Text variant="caption" weight={700} style={{ color: badgeColor }}>
          {badge}
        </Text>
      </div>
      <Text variant="caption" tone="tertiary">
        {timeAgo(post.created_at)}
      </Text>
    </div>
  );
}

interface CardProps {
  post: PostModel;
  myId?: string | null;
  hideAuthor?: boolean;
  onOpen?: (id: string) => void;
}

// ─────────────────────────────────────────
// ProjectCard
// ─────────────────────────────────────────

export function ProjectCard({ post, myId = null, hideAuthor, onOpen }: CardProps) {
  const navigate = useNavigate();
  const { colors, spacing, radii } = useTokens();
  const pp = post.project_posts!;
  const cfg = STATUS_CFG[pp.status];
  const img = [...(post.post_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const dur = calcDuration(pp.started_at, pp.ended_at);
  const hasDateRange = pp.started_at || pp.ended_at;
  const open = () => (onOpen ? onOpen(post.id) : navigate(`/post/${post.id}`));

  return (
    <FeedCard onPress={open}>
      <div style={{ padding: spacing.base }}>
        {hideAuthor ? (
          <BadgeRow post={post} badge="Project" badgeColor={colors.surface.skillhive} badgeBg={colors.surface.skillhive + "18"} />
        ) : (
          <AuthorRow post={post} myId={myId} badge="Project" badgeColor={colors.surface.skillhive} badgeBg={colors.surface.skillhive + "18"} />
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: spacing.sm }}>
          <Text variant="subtitle" numberOfLines={2} style={{ flex: 1 }}>
            {pp.title}
          </Text>
          <div style={{ background: cfg.bg, padding: "5px 8px", borderRadius: 999, flexShrink: 0 }}>
            <Text variant="caption" weight={700} style={{ color: cfg.color }}>
              {cfg.label}
            </Text>
          </div>
        </div>

        {hasDateRange && (
          <Text variant="bodySm" tone="tertiary" style={{ marginTop: spacing.xs }}>
            {pp.started_at ? fmtDate(pp.started_at) : "?"} →{" "}
            {pp.ended_at ? fmtDate(pp.ended_at) : "Present"}
            {dur ? `  ·  ${dur}` : ""}
          </Text>
        )}

        {img && (
          <img
            src={img}
            alt={pp.title}
            loading="lazy"
            style={{ width: "100%", height: 200, objectFit: "cover", marginTop: spacing.md, borderRadius: radii.lg, background: colors.surface.secondary, display: "block" }}
          />
        )}

        {pp.description && (
          <Text variant="body" tone="secondary" numberOfLines={3} style={{ marginTop: spacing.md }}>
            {pp.description}
          </Text>
        )}

        {post.caption && (
          <Text variant="bodySm" tone="tertiary" numberOfLines={2} style={{ marginTop: spacing.xs, fontStyle: "italic" }}>
            {post.caption}
          </Text>
        )}
      </div>

      <ActionRow postId={post.id} likes={post.likes_count} comments={post.comments_count} onCommentPress={() => navigate(`/post/${post.id}`, { state: { focusComment: true } })} />
    </FeedCard>
  );
}

// ─────────────────────────────────────────
// OfferCard
// ─────────────────────────────────────────

export function OfferCard({ post, myId = null, hideAuthor, onOpen }: CardProps) {
  const navigate = useNavigate();
  const { colors, spacing, radii } = useTokens();
  const op = post.offer_posts!;
  const typeLabel = op.offer_type ? OFFER_LABELS[op.offer_type] ?? op.offer_type : null;
  const open = () => (onOpen ? onOpen(post.id) : navigate(`/post/${post.id}`));

  return (
    <FeedCard onPress={open}>
      <div style={{ padding: spacing.base }}>
        {hideAuthor ? (
          <BadgeRow post={post} badge="Offer" badgeColor={colors.tint.success} badgeBg={colors.tint.success + "22"} />
        ) : (
          <AuthorRow post={post} myId={myId} badge="Offer" badgeColor={colors.tint.success} badgeBg={colors.tint.success + "22"} />
        )}

        <div style={{ background: colors.surface.secondary, borderRadius: radii.lg, padding: spacing.base, marginBottom: spacing.sm }}>
          {op.company && (
            <Text variant="caption" weight={700} style={{ color: colors.tint.success, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {op.company}
            </Text>
          )}
          <Text variant="title" weight={800} style={{ marginTop: op.company ? spacing.xs : 0 }}>
            {op.role ?? "Role TBD"}
          </Text>
          {(op.salary_range || op.location) && (
            <Text variant="bodySm" tone="secondary" style={{ marginTop: spacing.xs }}>
              {[op.salary_range, op.location].filter(Boolean).join(" · ")}
            </Text>
          )}
          {typeLabel && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: spacing.sm }}>
              <div style={{ background: colors.tint.success + "22", padding: "4px 8px", borderRadius: 999 }}>
                <Text variant="caption" weight={700} style={{ color: colors.tint.success }}>
                  {typeLabel}
                </Text>
              </div>
            </div>
          )}
        </div>

        {post.caption && (
          <Text variant="body" tone="secondary">
            {post.caption}
          </Text>
        )}
      </div>

      <ActionRow postId={post.id} likes={post.likes_count} comments={post.comments_count} onCommentPress={() => navigate(`/post/${post.id}`, { state: { focusComment: true } })} />
    </FeedCard>
  );
}

// ─────────────────────────────────────────
// MediaCard
// ─────────────────────────────────────────

export function MediaCard({ post, myId = null, hideAuthor, onOpen }: CardProps) {
  const navigate = useNavigate();
  const { colors, spacing, radii } = useTokens();
  const img = [...(post.post_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const open = () => (onOpen ? onOpen(post.id) : navigate(`/post/${post.id}`));

  return (
    <FeedCard onPress={open}>
      <div style={{ padding: spacing.base }}>
        {hideAuthor ? (
          <BadgeRow post={post} badge="Media" badgeColor={colors.surface.skillhive} badgeBg={colors.surface.skillhive + "18"} />
        ) : (
          <AuthorRow post={post} myId={myId} badge="Media" badgeColor={colors.surface.skillhive} badgeBg={colors.surface.skillhive + "18"} />
        )}

        {img && (
          <img
            src={img}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: 280, objectFit: "cover", marginBottom: spacing.md, borderRadius: radii.lg, background: colors.surface.secondary, display: "block" }}
          />
        )}

        {post.caption && (
          <Text variant="body" tone="secondary">
            {post.caption}
          </Text>
        )}
      </div>

      <ActionRow postId={post.id} likes={post.likes_count} comments={post.comments_count} onCommentPress={() => navigate(`/post/${post.id}`, { state: { focusComment: true } })} />
    </FeedCard>
  );
}

// Convenience dispatcher
export function PostCard({ post, myId = null, hideAuthor, onOpen }: CardProps) {
  if (post.post_type === "project") return <ProjectCard post={post} myId={myId} hideAuthor={hideAuthor} onOpen={onOpen} />;
  if (post.post_type === "offer") return <OfferCard post={post} myId={myId} hideAuthor={hideAuthor} onOpen={onOpen} />;
  if (post.post_type === "media") return <MediaCard post={post} myId={myId} hideAuthor={hideAuthor} onOpen={onOpen} />;
  return null;
}
