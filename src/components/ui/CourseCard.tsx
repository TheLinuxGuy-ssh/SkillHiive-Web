import { useState } from "react";
import { Users, MessageSquare } from "lucide-react";
import { useTokens } from "@/theme";

export interface CourseCardProps {
  title: string;
  instructor: string;
  description: string;
  progress?: number | null;
  enrolledCount: number;
  lessonCount: number;
  isNew?: boolean;
  thumbnail?: string | null;
  onPress?: () => void;
}

/**
 * CourseCard — web mirror of the mobile CourseCard: a 16:9 media card with a
 * dark gradient scrim and title/meta laid over the image bottom.
 */
export function CourseCard({
  title,
  instructor,
  description,
  progress,
  enrolledCount,
  lessonCount,
  isNew = false,
  thumbnail,
  onPress,
}: CourseCardProps) {
  const { radii } = useTokens();
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onClick={onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        borderRadius: radii.xl,
        overflow: "hidden",
        position: "relative",
        aspectRatio: "16 / 9",
        cursor: onPress ? "pointer" : "default",
        background: thumbnail ? "#111" : "linear-gradient(135deg, #1a1a1a, #2a2a12)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.15s cubic-bezier(0.2,0.8,0.2,1)",
        marginBottom: 16,
      }}
    >
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.92) 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 16,
          gap: 6,
        }}
      >
        {isNew && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 11 }}>🟡</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.9 }}>
              New Course
            </span>
          </div>
        )}

        <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: "28px", letterSpacing: -0.3 }}>
          {title} <span style={{ fontWeight: 800 }}>with {instructor}!</span>
        </span>

        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: "17px" }}>
          {description}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          {typeof progress === "number" ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.2)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(Math.max(progress, 0), 100)}%`, background: "#a3e635", borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#a3e635", minWidth: 28, textAlign: "right" }}>
                {progress}%
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>Not started</span>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
              <Users size={11} /> {enrolledCount}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
              <MessageSquare size={11} /> {lessonCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;
