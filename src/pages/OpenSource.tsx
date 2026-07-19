import { useEffect, useState } from "react";
import { useTokens } from "@/theme";
import { Text } from "@/components/ui";
import { BookMarked, GitFork } from "lucide-react";


interface RepoCardData {
  name: string;
  description: string;
  stargazers_count: number;
  language: string;
  forks_count?: number;
  updated_at?: string;
  private?: boolean;
  isFallback?: boolean;
}

interface OrgStats {
  repoCount: number;
  stars: number;
  forks: number;
  openIssues: number;
}

interface CommitLogEntry {
  hash: string;
  repo: string;
  kind: "feat" | "fix" | "perf" | "chore" | "docs";
  scope?: string;
  message: string;
  date: string;
}

const ORG = "SkillHiive";
const ORG_URL = `https://github.com/${ORG}`;
const ORG_REPOS_URL = `https://github.com/orgs/${ORG}/repositories`;

const FALLBACK_REPOS: RepoCardData[] = [
  {
    name: "web",
    description:
      "The web client for SkillHiive. Built with complete feature parity alongside the native mobile experience.",
    language: "TypeScript",
    stargazers_count: 0,
    isFallback: true,
  },
  {
    name: "mobile",
    description:
      "The native React Native application for Android and iOS, delivering the full SkillHiive experience on mobile.",
    language: "TypeScript",
    stargazers_count: 0,
    isFallback: true,
  },
  {
    name: "backend",
    description:
      "Backend services powering authentication, real-time collaboration, LiveKit session management, and platform APIs.",
    language: "JavaScript",
    stargazers_count: 0,
    isFallback: true,
  },
];

const COMMIT_LOG: CommitLogEntry[] = [
  {
    hash: "a3f9c1e",
    repo: "org",
    kind: "chore",
    message: "opened SkillHiive to the open-source community",
    date: "today",
  },
  {
    hash: "d281bb4",
    repo: "skillhiive-web",
    kind: "docs",
    message: "added community documentation and contribution guides",
    date: "today",
  },
  {
    hash: "9c04e7a",
    repo: "skillhiive-mobile",
    kind: "feat",
    scope: "platform",
    message: "completed feature parity with the web client",
    date: "2d",
  },
  {
    hash: "5b71f02",
    repo: "skillhiive-backend",
    kind: "feat",
    scope: "realtime",
    message: "secure LiveKit token issuance and session authentication",
    date: "4d",
  },
  {
    hash: "1e88a3d",
    repo: "skillhiive-web",
    kind: "feat",
    scope: "beta",
    message: "prepared public beta release",
    date: "1w",
  },
];

const PHILOSOPHY = [
  {
    title: "Built in the open",
    description:
      "SkillHiive is developed transparently. The same code running the platform is the code you can inspect, improve, and contribute to.",
  },
  {
    title: "Community before engagement",
    description:
      "We don't optimize for clicks, streaks, or endless scrolling. We build software that encourages meaningful work, genuine collaboration, and intentional interaction.",
  },
  {
    title: "Open source by commitment",
    description:
      "Open source isn't a feature or a marketing strategy. It's our commitment to transparency, trust, and building SkillHiive alongside the community.",
  },
];

const TECH_STACK = [
  { name: "React", category: "web" },
  { name: "React Native", category: "mobile" },
  { name: "TypeScript", category: "platform" },
  { name: "Node.js", category: "backend" },
  { name: "Express", category: "backend" },
  { name: "Supabase", category: "backend" },
  { name: "LiveKit", category: "realtime" },
];

const CONTRIBUTE_STEPS = [
  {
    command: "git clone https://github.com/SkillHiive/<repo>.git",
    comment: "clone the repository",
  },
  {
    command: "npm install",
    comment: "install dependencies",
  },
  {
    command: "cp .env.example .env.local",
    comment: "copy the example env file",
  },
  {
    command: "npm run dev",
    comment: "start the development server",
  },
  {
    command: "git checkout -b feature/my-change",
    comment: "build something",
  },
  {
    command: "git push origin feature/my-change",
    comment: "push your branch",
  },
  {
    command: "Open a Pull Request",
    comment: "we'll review it together",
  },
];

function useOrgRepos(fallback: RepoCardData[]) {
  const [repos, setRepos] = useState<RepoCardData[]>(fallback);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `https://api.github.com/orgs/${ORG}/repos?per_page=100&type=public`,
        );
        if (!res.ok) throw new Error("org repos fetch failed");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("unexpected response");

        const live: RepoCardData[] = data.filter(
          (r: any) => r.name !== ".github",
        );

        if (!cancelled && data.length > 0) {
          setRepos(live);
          setIsLive(true);
        }
      } catch {
        // static fallback already covers this render
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fallback]);

  const stats: OrgStats = {
    repoCount: repos.length,
    stars: repos.reduce((sum, r) => sum + r.stargazers_count, 0),
    forks: 0,
    openIssues: 0,
  };

  return { repos, stats, isLive };
}

function GithubMark({ size = 16, color }: { size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.1-3.16.69-3.83-1.34-3.83-1.34-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0c2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.65 5.31-5.18 5.59.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .3.2.66.79.55A11.26 11.26 0 0 0 23.25 11.75C23.25 5.48 18.27.5 12 .5Z" />
    </svg>
  );
}

function ArrowUpRight({ size = 14, color }: { size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

function Star({ size = 12, color }: { size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 2.5 15 9l7 .9-5.2 4.9L18.2 21 12 17.4 5.8 21l1.4-6.2L2 9.9 9 9z" />
    </svg>
  );
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
};

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function OpenSource() {
  const { colors, spacing, radii, typography } = useTokens();
  const { repos, stats, isLive } = useOrgRepos(FALLBACK_REPOS);

  const commitKindColor: Record<CommitLogEntry["kind"], string> = {
    feat: colors.tint.success,
    perf: colors.tint.success,
    fix: colors.tint.warning,
    chore: colors.text.tertiary,
    docs: colors.text.tertiary,
  };

  const monoFont =
    'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace';

  const card: React.CSSProperties = {
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: radii.lg,
    background: colors.surface.secondary,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: typography.label.size,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.text.tertiary,
    fontWeight: typography.label.weight,
    fontFamily: monoFont,
  };

  return (
    <section
      style={{
        width: "100%",
        padding: `${spacing.giant}px ${spacing.xl}px`,
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: spacing.base,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: colors.surface.skillhive,
            }}
          />
          <Text
            variant="label"
            style={{
              color: colors.surface.skillhive,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              fontFamily: monoFont,
            }}
          >
            open source
          </Text>
        </div>

        {/* Hero */}
        <div
          style={{
            gap: spacing.xxxl,
            alignItems: "center",
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
        >
          <div>
            <Text
              as="h2"
              variant="headline"
              style={{
                color: colors.text.primary,
                lineHeight: `${typography.headline.lineHeight}px`,
                letterSpacing: typography.headline.letterSpacing,
                margin: 0,
              }}
            >
              We're making SkillHiive public. All of it.
            </Text>
            <Text
              variant="bodyLg"
              tone="secondary"
              style={{
                display: "block",
                maxWidth: 440,
                marginTop: spacing.base,
                color: colors.text.secondary,
              }}
            >
              Not one repo — the app, the self-hosted auth server, and the infra
              behind it, published as they actually exist. Pick whichever piece
              you're curious about.
            </Text>

            <div
              style={{
                gap: spacing.lg,
                marginTop: spacing.xl,
                flexWrap: "wrap",
              }}
              className="flex"
            >
              <a
                href={ORG_URL}
                target="_blank"
                rel="noreferrer"
                className="transition-ui group hover:scale-[1.025] hover:shadow-md shadow-yellow-400/30 active:scale-[0.975] active:shadow-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  padding: `${spacing.sm + 2}px ${spacing.lg}px`,
                  borderRadius: radii.md,
                  background: colors.surface.skillhive,
                  color: colors.text.onTint,
                  fontWeight: 800,
                  fontSize: typography.bodySm.size,
                  textDecoration: "none",
                }}
              >
                <span className="transition-ui group-hover:scale-[1.025]  flex gap-2 items-center">
                  <GithubMark size={16} color={colors.text.onTint} />
                  View organisation
                </span>
              </a>
              <a
                href={ORG_REPOS_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: spacing.xs,
                  color: colors.text.tertiary,
                  fontSize: typography.bodySm.size,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
                className={`transition-ui hover:scale-[1.025] hover:!text-white active:scale-[0.975]`}
              >
                See all repositories
                <ArrowUpRight size={13} color={colors.text.tertiary} />
              </a>
            </div>
          </div>

          {/* Signature: cross-repo activity log */}
          <div className="flex justify-center">
            <div
              className="transition-ui "
              style={{
                ...card,
                width: "100%",
                maxWidth: 460,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  padding: `${spacing.sm}px ${spacing.base}px`,
                  borderBottom: `1px solid ${colors.border.subtle}`,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: colors.tint.danger,
                    opacity: 0.7,
                  }}
                />
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: colors.tint.warning,
                    opacity: 0.7,
                  }}
                />
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: colors.tint.success,
                    opacity: 0.7,
                  }}
                />
                <Text
                  variant="caption"
                  tone="tertiary"
                  style={{
                    marginLeft: spacing.xs,
                    fontFamily: monoFont,
                    color: colors.text.tertiary,
                  }}
                >
                  activity — across repos
                </Text>
              </div>
              <div
                style={{
                  padding: spacing.base,
                  display: "flex",
                  flexDirection: "column",
                  gap: spacing.sm,
                }}
              >
                {COMMIT_LOG.map((entry) => (
                  <div
                    key={entry.hash}
                    style={{
                      fontFamily: monoFont,
                      fontSize: 12.5,
                      lineHeight: 1.6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        gap: spacing.xs,
                      }}
                    >
                      <span style={{ color: colors.text.tertiary }}>
                        {entry.hash}
                      </span>
                      <span
                        style={{
                          color: colors.text.tertiary,
                          border: `1px solid ${colors.border.subtle}`,
                          borderRadius: radii.xs,
                          padding: "0 4px",
                          fontSize: 10.5,
                        }}
                      >
                        {entry.repo}
                      </span>
                      <span style={{ color: commitKindColor[entry.kind] }}>
                        {entry.kind}
                        {entry.scope ? `(${entry.scope})` : ""}:
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          color: colors.text.tertiary,
                        }}
                      >
                        {entry.date}
                      </span>
                    </div>
                    <div style={{ color: colors.text.primary, marginTop: 2 }}>
                      {entry.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Repositories */}
        <div style={{ marginTop: spacing.xxxl }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: spacing.lg,
            }}
          >
            <Text variant="label" style={{ ...sectionLabel, marginBottom: 0 }}>
              Repositories
            </Text>
            <div
              style={{ display: "flex", alignItems: "center", gap: spacing.xs }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isLive
                    ? colors.tint.success
                    : colors.text.tertiary,
                }}
              />
              <Text
                variant="caption"
                tone="tertiary"
                style={{ fontFamily: monoFont, color: colors.text.tertiary }}
              >
                {isLive ? "live" : "baseline"}
              </Text>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: spacing.md,
            }}
            className="grid-cols-1 sm:grid-cols-2 md:grid-col-3 lg:grid-cols-3"
          >
            {repos.map((repo) => (
              <a
                key={repo.name}
                href={`${ORG_URL}/${repo.name}`}
                target="_blank"
                rel="noreferrer"
                className="hover:scale-[1.025] hover:shadow-md hover:!border-[#fffd01] shadow-yellow-400/10 active:scale-[0.975] active:shadow-sm transition-ui"
                style={{
                  ...card,
                  display: "block",
                  padding: spacing.lg,
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <BookMarked size={14} color={colors.text.tertiary} />
                  <Text
                    className="uppercase"
                    style={{
                      color: colors.text.primary,
                      fontWeight: 700,
                      fontSize: typography.bodyLg.size,
                      fontFamily: monoFont,
                    }}
                  >
                    {repo.name}
                  </Text>
                  {repo.private && (
                    <span
                      style={{
                        fontSize: 10,
                        border: `1px solid ${colors.text.tertiary}`,
                        borderRadius: 999,
                        padding: "1px 6px",
                        color: colors.text.tertiary,
                        fontFamily: monoFont,
                      }}
                    >
                      private
                    </span>
                  )}
                </div>

                <Text
                  variant="bodySm"
                  style={{
                    display: "block",
                    marginTop: spacing.xs,
                    color: colors.text.secondary,
                    lineHeight: 1.5,
                    minHeight: 36,
                  }}
                >
                  {repo.description || "No description provided"}
                </Text>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing.md,
                    flexWrap: "wrap",
                  }}
                  className="mt-5"
                >
                  {repo.language && (
                    <div
                      style={{ display: "flex", alignItems: "end", gap: 5 }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background:
                            LANGUAGE_COLORS[repo.language] ??
                            colors.text.tertiary,
                        }}
                      />
                      <Text
                        variant="caption"
                        tone="tertiary"
                        style={{ color: colors.text.tertiary }}
                      >
                        {repo.language}
                      </Text>
                    </div>
                  )}

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Star size={11} color={colors.text.tertiary} />
                    <Text
                      variant="caption"
                      tone="tertiary"
                      style={{ color: colors.text.tertiary }}
                    >
                      {repo.stargazers_count}
                    </Text>
                  </div>

                  {typeof repo.forks_count === "number" && (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <GitFork size={11} color={colors.text.tertiary} />
                      <Text
                        variant="caption"
                        tone="tertiary"
                        style={{ color: colors.text.tertiary }}
                      >
                        {repo.forks_count}
                      </Text>
                    </div>
                  )}

                  {repo.updated_at && (
                    <Text
                      variant="caption"
                      tone="tertiary"
                      style={{
                        color: colors.text.tertiary,
                        marginLeft: "auto",
                      }}
                    >
                      Updated {formatRelativeTime(repo.updated_at)}
                    </Text>
                  )}
                </div>
              </a>
            ))}
          </div>

          <Text
            variant="caption"
            tone="tertiary"
            style={{
              display: "block",
              marginTop: spacing.md,
              color: colors.text.tertiary,
            }}
          >
            {stats.repoCount} public {stats.repoCount === 1 ? "repo" : "repos"}{" "}
            · {stats.stars} stars combined
          </Text>
        </div>

        {/* Philosophy */}
        <div style={{ marginTop: spacing.xxxl }}>
          <Text variant="label" style={sectionLabel}>
            Why the code is public
          </Text>
          <div
          className="grid-cols-1 md:lg-grid-col-3 lg:grid-cols-3"
            style={{
              display: "grid",
              gap: 1,
              background: colors.border.subtle,
              borderRadius: radii.lg,
              marginTop: spacing.md,
              overflow: "hidden",
              border: `1px solid ${colors.border.subtle}`,
            }}
          >
            {PHILOSOPHY.map((point) => (
              <div
                key={point.title}
                style={{
                  background: colors.surface.secondary,
                  padding: spacing.lg,
                }}
              >
                <Text
                  style={{
                    color: colors.surface.skillhive,
                    fontWeight: 700,
                    fontSize: typography.bodySm.size,
                  }}
                >
                  {point.title}
                </Text>
                <Text
                  variant="bodySm"
                  style={{
                    display: "block",
                    marginTop: spacing.sm,
                    color: colors.text.secondary,
                    lineHeight: 1.6,
                  }}
                >
                  {point.description}
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Stack + Contribute */}
        <div
          style={{
            marginTop: spacing.xxxl,
            display: "grid",
            gap: spacing.xxl,
          }}
          className="grid-cols-1 md:lg-grid-col-2 lg:grid-cols-2"
        >
          <div>
            <Text variant="label" style={sectionLabel}>
              Built with
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
              {TECH_STACK.map((item) => (
                <span
                  key={item.name}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: spacing.xs,
                    borderRadius: radii.pill,
                    border: `1px solid ${colors.border.subtle}`,
                    background: colors.surface.secondary,
                    padding: `${spacing.xs + 2}px ${spacing.md}px`,
                    fontFamily: monoFont,
                    fontSize: 11.5,
                    color: colors.text.secondary,
                  }}
                >
                  <span style={{ color: colors.text.tertiary }}>
                    {item.category}
                  </span>
                  <span style={{ color: colors.text.tertiary, opacity: 0.6 }}>
                    /
                  </span>
                  {item.name}
                </span>
              ))}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: spacing.xs,
                  borderRadius: radii.pill,
                  border: `1px solid ${colors.border.primary}`,
                  background: colors.bg.accentDim,
                  padding: `${spacing.xs + 2}px ${spacing.md}px`,
                  fontFamily: monoFont,
                  fontSize: 11.5,
                  color: colors.text.secondary,
                }}
              >
                Self Hosted Servers
              </span>
            </div>
          </div>

          <div>
            <Text className="" variant="label" style={sectionLabel}>
              Get started
            </Text>
            <div style={card}>
              <div
                style={{
                  borderBottom: `1px solid ${colors.border.subtle}`,
                  padding: `${spacing.sm}px ${spacing.base}px`,
                  fontFamily: monoFont,
                  fontSize: 11.5,
                  color: colors.text.tertiary,
                }}
              >
                first contribution
              </div>
              <div
                style={{
                  padding: spacing.base,
                  display: "flex",
                  flexDirection: "column",
                  gap: spacing.md,
                }}
              >
                {CONTRIBUTE_STEPS.map((step, i) => (
                  <div key={i} style={{ fontFamily: monoFont, fontSize: 12.5 }}>
                    <div style={{ display: "flex", gap: spacing.xs }}>
                      <span
                        className="select-none"
                        style={{ color: colors.surface.skillhive }}
                      >
                        $
                      </span>
                      <span style={{ color: colors.text.primary }}>
                        {step.command}
                      </span>
                    </div>
                    <div
                      style={{
                        marginLeft: spacing.md,
                        color: colors.text.tertiary,
                      }}
                    >
                      # {step.comment}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center my-40">
        <p className="fs-closer-text">
          You'll understand the rest once you use it.
        </p>
      </div>
    </section>
  );
}

export default OpenSource;
