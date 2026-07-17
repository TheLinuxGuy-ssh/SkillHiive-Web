import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
  Upload,
  X,
  Check,
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

// avatar: 1:1 · banner: 1000/350
const ASPECT_RATIOS: Record<"avatar" | "banner", number> = {
  avatar: 1,
  banner: 1000 / 350,
};

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
  const [uploadingBn, setUploadingBn] = useState(false);

  // ── crop dialog state ──
  const [cropType, setCropType] = useState<"avatar" | "banner" | null>(null);
  const [cropPickedFile, setCropPickedFile] = useState<File | null>(null);

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

  // ── image upload (now receives an already-cropped blob) ──
  async function uploadImage(blob: Blob, type: "avatar" | "banner") {
    const uid = profile?.id;
    if (!uid) return;
    type === "avatar" ? setUploadingAv(true) : setUploadingBn(true);
    try {
      const path = `${uid}/${type}-${Date.now()}.jpg`;
      const { data, error: uploadErr } = await supabase.storage
        .from("profile-images")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
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
      type === "avatar" ? setUploadingAv(false) : setUploadingBn(false);
    }
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner",
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // Route the picked file into the crop dialog instead of uploading
    // straight away — the dialog owns the final upload.
    setCropType(type);
    setCropPickedFile(file);
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
        {/* hidden file inputs — still used to open the OS file picker */}
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

        {/* crop dialog — opens as soon as a type is selected for editing */}
        {cropType && (
          <ImageCropDialog
            type={cropType}
            initialFile={cropPickedFile}
            onRequestFile={() =>
              (cropType === "avatar" ? avInputRef : bnInputRef).current?.click()
            }
            onClose={() => {
              setCropType(null);
              setCropPickedFile(null);
            }}
            onConfirm={async (blob) => {
              await uploadImage(blob, cropType);
              setCropType(null);
              setCropPickedFile(null);
            }}
          />
        )}

        {/* ── BANNER ── */}
        <div
          onClick={() => setCropType("banner")}
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
          {uploadingBn && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MiniSpin light />
            </div>
          )}
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
                onClick={() => setCropType("avatar")}
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
                    position: "relative",
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
// CROP DIALOG
// ─────────────────────────────────────────
// A self-contained upload → crop → confirm flow. No external cropping
// library — a fixed-aspect box the user can drag and resize (by its
// corners) over the image, rendered to a canvas on confirm.

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function ImageCropDialog({
  type,
  initialFile,
  onRequestFile,
  onClose,
  onConfirm,
}: {
  type: "avatar" | "banner";
  initialFile: File | null;
  onRequestFile: () => void;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
}) {
  const { colors, spacing, radii } = useTokens();
  const aspect = ASPECT_RATIOS[type];

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const [box, setBox] = useState<CropBox | null>(null);
  const [confirming, setConfirming] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragState = useRef<{
    mode: "move" | "resize";
    corner?: "tl" | "tr" | "bl" | "br";
    startX: number;
    startY: number;
    startBox: CropBox;
  } | null>(null);

  const previewH = 340;

  // load the initially-picked file as soon as the dialog mounts
  useEffect(() => {
    if (initialFile) {
      const url = URL.createObjectURL(initialFile);
      setImgSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [initialFile]);

  function handleImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });

    const rect = img.getBoundingClientRect();
    // default crop box: as large as possible at the target aspect,
    // centered on the displayed image
    let w = rect.width;
    let h = w / aspect;
    if (h > rect.height) {
      h = rect.height;
      w = h * aspect;
    }
    setBox({
      x: (rect.width - w) / 2,
      y: (rect.height - h) / 2,
      w,
      h,
    });
  }

  const clampBox = useCallback((b: CropBox): CropBox => {
    const frame = imgRef.current?.getBoundingClientRect();
    if (!frame) return b;
    let { x, y, w, h } = b;
    w = Math.min(w, frame.width);
    h = Math.min(h, frame.height);
    x = Math.max(0, Math.min(x, frame.width - w));
    y = Math.max(0, Math.min(y, frame.height - h));
    return { x, y, w, h };
  }, []);

  function onBoxPointerDown(
    e: ReactPointerEvent,
    mode: "move" | "resize",
    corner?: "tl" | "tr" | "bl" | "br",
  ) {
    if (!box) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = {
      mode,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startBox: box,
    };
  }

  function onPointerMove(e: ReactPointerEvent) {
    const drag = dragState.current;
    if (!drag || !box) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (drag.mode === "move") {
      setBox(
        clampBox({
          ...drag.startBox,
          x: drag.startBox.x + dx,
          y: drag.startBox.y + dy,
        }),
      );
      return;
    }

    // resize: scale from the opposite corner, preserving aspect ratio
    const { x, y, w, h } = drag.startBox;
    let newW = w;
    switch (drag.corner) {
      case "br":
        newW = w + dx;
        break;
      case "bl":
        newW = w - dx;
        break;
      case "tr":
        newW = w + dx;
        break;
      case "tl":
        newW = w - dx;
        break;
    }
    newW = Math.max(40, newW);
    const newH = newW / aspect;

    let newX = x;
    let newY = y;
    if (drag.corner === "tl") {
      newX = x + (w - newW);
      newY = y + (h - newH);
    } else if (drag.corner === "tr") {
      newY = y + (h - newH);
    } else if (drag.corner === "bl") {
      newX = x + (w - newW);
    }
    // "br" keeps x/y as-is

    setBox(clampBox({ x: newX, y: newY, w: newW, h: newH }));
  }

  function onPointerUp() {
    dragState.current = null;
  }

  async function handleConfirm() {
    if (!box || !imgRef.current) return;
    setConfirming(true);
    try {
      const img = imgRef.current;
      const rect = img.getBoundingClientRect();
      const scaleX = imgNaturalSize.w / rect.width;
      const scaleY = imgNaturalSize.h / rect.height;

      const outW = type === "avatar" ? 512 : 1000;
      const outH = Math.round(outW / aspect);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(
        img,
        box.x * scaleX,
        box.y * scaleY,
        box.w * scaleX,
        box.h * scaleY,
        0,
        0,
        outW,
        outH,
      );

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
      );
      if (blob) await onConfirm(blob);
    } finally {
      setConfirming(false);
    }
  }

  const handleSize = 12;
  const corners: {
    key: "tl" | "tr" | "bl" | "br";
    style: React.CSSProperties;
  }[] = [
    {
      key: "tl",
      style: { top: -handleSize / 2, left: -handleSize / 2, cursor: "nwse-resize" },
    },
    {
      key: "tr",
      style: { top: -handleSize / 2, right: -handleSize / 2, cursor: "nesw-resize" },
    },
    {
      key: "bl",
      style: { bottom: -handleSize / 2, left: -handleSize / 2, cursor: "nesw-resize" },
    },
    {
      key: "br",
      style: { bottom: -handleSize / 2, right: -handleSize / 2, cursor: "nwse-resize" },
    },
  ];

  // translate offset so the overlay/box line up with the image, which is
  // centered inside the (larger) preview frame via flex alignment
  function imgOffset() {
    const img = imgRef.current;
    const frame = frameRef.current;
    if (!img || !frame) return { x: 0, y: 0 };
    const imgRect = img.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    return { x: imgRect.left - frameRect.left, y: imgRect.top - frameRect.top };
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        padding: spacing.lg,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: colors.bg.muted,
          border: `1px solid ${colors.border.subtle}`,
          borderRadius: radii.lg,
          padding: spacing.lg,
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
            {type === "avatar" ? "Update avatar" : "Update banner"}
          </Text>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              padding: 4,
            }}
          >
            <X size={18} color={colors.text.tertiary} />
          </button>
        </div>

        {!imgSrc ? (
          // ── step 1: pick a file ──
          <div
            style={{
              border: `1px dashed ${colors.border.subtle}`,
              borderRadius: radii.md,
              padding: `${spacing.xxl}px ${spacing.lg}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <Text variant="bodySm" tone="secondary" align="center">
              {type === "avatar"
                ? "Square image, cropped to 1:1"
                : "Wide image, cropped to 1000:350"}
            </Text>
            <Button
              label="Choose photo"
              icon={<Upload size={14} />}
              variant="primary"
              onClick={onRequestFile}
            />
          </div>
        ) : (
          // ── step 2: crop ──
          <>
            <div
              ref={frameRef}
              style={{
                position: "relative",
                width: "100%",
                height: previewH,
                background: "#000",
                borderRadius: radii.md,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                touchAction: "none",
              }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                onLoad={handleImgLoad}
                alt="Selected upload"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  display: "block",
                  userSelect: "none",
                }}
                draggable={false}
              />

              {box &&
                (() => {
                  const offset = imgOffset();
                  return (
                    <>
                      {/* dim everything outside the crop box */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          right: 0,
                          bottom: 0,
                          boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                          clipPath: `polygon(
                            0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                            ${box.x}px ${box.y}px,
                            ${box.x}px ${box.y + box.h}px,
                            ${box.x + box.w}px ${box.y + box.h}px,
                            ${box.x + box.w}px ${box.y}px,
                            ${box.x}px ${box.y}px
                          )`,
                          transform: `translate(${offset.x}px, ${offset.y}px)`,
                          pointerEvents: "none",
                        }}
                      />

                      {/* draggable crop box */}
                      <div
                        onPointerDown={(e) => onBoxPointerDown(e, "move")}
                        style={{
                          position: "absolute",
                          left: box.x,
                          top: box.y,
                          width: box.w,
                          height: box.h,
                          border: `2px solid ${colors.surface.skillhive}`,
                          cursor: "grab",
                          transform: `translate(${offset.x}px, ${offset.y}px)`,
                        }}
                      >
                        {corners.map((c) => (
                          <div
                            key={c.key}
                            onPointerDown={(e) =>
                              onBoxPointerDown(e, "resize", c.key)
                            }
                            style={{
                              position: "absolute",
                              width: handleSize,
                              height: handleSize,
                              borderRadius: type === "avatar" ? "50%" : 2,
                              background: colors.surface.skillhive,
                              ...c.style,
                            }}
                          />
                        ))}
                      </div>
                    </>
                  );
                })()}
            </div>

            <Text
              variant="caption"
              tone="tertiary"
              style={{ display: "block", marginTop: spacing.sm }}
            >
              Drag to reposition, use the corner handles to resize.
            </Text>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: spacing.sm,
                marginTop: spacing.lg,
              }}
            >
              <Button label="Cancel" variant="secondary" onClick={onClose} />
              <Button
                label={confirming ? "Uploading…" : "Confirm"}
                icon={<Check size={14} />}
                variant="primary"
                disabled={confirming}
                onClick={() => void handleConfirm()}
              />
            </div>
          </>
        )}
      </div>
    </div>
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