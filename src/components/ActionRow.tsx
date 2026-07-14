import { supabase } from "@/lib/supabase";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTokens } from "@/theme";

export default function ActionRow({
  postId,
  likes,
  comments,
  onCommentPress,
  noborder,
}: {
  postId: string;
  likes: number;
  comments: number;
  onCommentPress?: (id: string) => void;
  noborder?: boolean;
}) {
  const { colors, spacing } = useTokens();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setLiked(!!data);
    }
    check();
    return () => { cancelled = true; };
  }, [postId]);

  const handleLike = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (loading) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    if (liked) {
      setLiked(false);
      setLikeCount(c => Math.max(c - 1, 0));
      const { error } = await supabase.from("likes").delete()
        .eq("post_id", postId).eq("user_id", user.id);
      if (error) { setLiked(true); setLikeCount(c => c + 1); }
    } else {
      setLiked(true);
      setLikeCount(c => c + 1);
      const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
      if (error) { setLiked(false); setLikeCount(c => Math.max(c - 1, 0)); }
    }
    setLoading(false);
  }, [liked, loading, postId]);

  const pill = (active: boolean, key: string): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    border: "none",
    cursor: "pointer",
    color: active ? "#ef4444" : colors.text.tertiary,
    background:
      hover === key
        ? active
          ? "rgba(239,68,68,0.15)"
          : colors.surface.secondary
        : active
          ? "rgba(239,68,68,0.10)"
          : "transparent",
    transition: "background 0.15s, color 0.15s",
    fontFamily: "inherit",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: `${spacing.sm}px ${spacing.base}px`,
        borderTop: noborder ? "none" : `1px solid ${colors.border.subtle}`,
      }}
    >
      <button
        onClick={handleLike}
        disabled={loading}
        onMouseEnter={() => setHover("like")}
        onMouseLeave={() => setHover(null)}
        style={{ ...pill(liked, "like"), opacity: loading ? 0.5 : 1 }}
      >
        <Heart size={16} fill={liked ? "#ef4444" : "none"} />
        <span>{likeCount > 0 ? likeCount : "Like"}</span>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onCommentPress?.(postId); }}
        onMouseEnter={() => setHover("comment")}
        onMouseLeave={() => setHover(null)}
        style={pill(false, "comment")}
      >
        <MessageCircle size={16} />
        <span>{comments > 0 ? comments : "Comment"}</span>
      </button>

      <div style={{ flex: 1 }} />

      <button
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setHover("share")}
        onMouseLeave={() => setHover(null)}
        style={{
          width: 30,
          height: 30,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          color: colors.text.tertiary,
          background: hover === "share" ? colors.surface.secondary : "transparent",
          transition: "background 0.15s",
        }}
      >
        <Share2 size={14} />
      </button>
    </div>
  );
}
