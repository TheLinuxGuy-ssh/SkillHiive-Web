import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import SwipeLayout from "@/components/SwipeLayout";
import { supabase } from "@/lib/supabase";
import { CourseCard } from "@/components/ui/CourseCard";
import { Text } from "@/components/ui";
import { useTokens } from "@/theme";

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  total_weeks: number;
  is_published: boolean;
  author: string;
  profiles?: { displayname: string; avatar: string } | null;
}

export default function Learn() {
  const navigate = useNavigate();
  const { colors, spacing } = useTokens();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, profiles (displayname, avatar)");
      if (!error && data) setCourses(data as Course[]);
      setLoading(false);
    })();
  }, []);

  return (
    <SwipeLayout>
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg.muted,
          paddingTop: 80,
          fontFamily:
            '"popreg", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
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
          <div style={{ paddingTop: spacing.xl, marginBottom: spacing.base }}>
            <Text variant="title">Learn</Text>
            <Text
              variant="bodySm"
              tone="tertiary"
              style={{ display: "block", marginTop: 2 }}
            >
              Courses from the hive
            </Text>
          </div>

          {loading ? (
            <Text
              align="center"
              tone="tertiary"
              style={{ display: "block", padding: "64px 0" }}
            >
              Loading courses…
            </Text>
          ) : courses.length === 0 ? (
            <Text
              align="center"
              tone="tertiary"
              style={{ display: "block", padding: "64px 0" }}
            >
              No courses yet. Check back soon.
            </Text>
          ) : (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                title={course.title}
                instructor={course.profiles?.displayname ?? "the hive"}
                description={course.description}
                progress={null}
                enrolledCount={0}
                lessonCount={course.total_weeks ?? 0}
                isNew
                thumbnail={course.thumbnail_url}
                onPress={() => navigate(`/course/${course.id}`)}
              />
            ))
          )}
        </main>
      </div>
    </SwipeLayout>
  );
}
