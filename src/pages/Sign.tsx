import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { useTokens } from "@/theme";
import { Text } from "@/components/ui";
import peace from "@/assets/sign.mp4"
import { Button } from "@headlessui/react";

function ArrowUpRight({ size = 13, color }: { size?: number; color: string }) {
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

function LockIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="1.5" />
      <path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3" />
    </svg>
  );
}

const monoFont =
  'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace';

export default function Sign() {
  const navigate = useNavigate();
  const { colors, spacing, radii, typography } = useTokens();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      setTimeout(() => {
        setError(null);
      }, 5000)
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.session) {
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: typography.label.size,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.text.tertiary,
    fontWeight: typography.label.weight,
    fontFamily: monoFont,
  };

  const inputStyle = (field: "email" | "password"): React.CSSProperties => ({
    width: "100%",
    height: 48,
    background: colors.surface.secondary,
    border: `1px solid ${
      focused === field ? colors.surface.skillhive : colors.border.subtle
    }`,
    borderRadius: radii.md,
    padding: `0 ${spacing.base}px`,
    color: colors.text.primary,
    fontSize: typography.bodySm.size,
    outline: "none",
    transition: "border-color 120ms ease",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%"
      }}
      className="skillhive-sign-grid relative flex items-end justify-start"
    >
      <video src={peace} className="absolute top-0 -scale-x-100 left-0 object-cover min-h-dvh -z-1" playsInline muted autoPlay loop></video>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xxl,
        }}
        className="w-full"
      >
        <div className="flex-col sm:block items-center justify-start w-[90%] lg:w-[50%]">
          {/* <div style={{ marginBottom: spacing.xxl }}>
            <Text
              as="h2"
              variant="headline"
              className="text-center mix-blend-color-burn"
              style={{
                color: colors.text.primary,
                marginTop: spacing.sm,
                lineHeight: `${typography.headline.lineHeight}px`,
              }}
            >
              Sign in
            </Text>
          </div> */}

          <form
            onSubmit={handleLogin}
            style={{ gap: spacing.lg }}
            className="block md:flex lg:flex xl:flex"
          >
            <div className="flex-col w-full my-2">
              {/* <Text
                variant="label"
                style={{
                  ...sectionLabel,
                  display: "block",
                  marginBottom: spacing.xs,
                }}
              >
                Email address
              </Text> */}
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                disabled={loading}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle("email")}
              />
            </div>

            <div className="flex-col justify-center items-center w-full my-2">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* <Text variant="label" style={sectionLabel}>
                  Password
                </Text> */}
                {/* <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 11.5,
                    fontFamily: monoFont,
                    letterSpacing: 0.5,
                    color: colors.text.tertiary,
                  }}
                  className="transition-ui hover:!text-white"
                >
                  Forgot access?
                </button> */}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                disabled={loading}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle("password")}
              />
            </div>

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.xs,
                  padding: `${spacing.sm}px ${spacing.base}px`,
                  borderRadius: radii.md,
                  border: `1px solid ${colors.tint.danger}`,
                  background: colors.bg.accentDim ?? colors.surface.secondary,
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <Text
                  variant="caption"
                  style={{ color: colors.tint.danger, fontFamily: monoFont }}
                >
                  {error}
                </Text>
              </div>
            )}
            <div className="flex items-end justify-center w-full lg:w-[25em] md:w-[25em] xl:w-[25em] my-1">
            <button
              type="submit"
              disabled={loading}
              className="transition-ui hover:scale-[1.01] active:scale-[0.99]"
              style={{
                width: "100%",
                height: 50,
                marginTop: spacing.xs,
                borderRadius: radii.md,
                border: `1px solid ${colors.surface.skillhive}`,
                background: loading ? "transparent" : colors.surface.skillhive,
                color: loading ? colors.surface.skillhive : colors.text.onTint,
                fontWeight: 700,
                letterSpacing: 2,
                fontSize: typography.bodySm.size,
                textTransform: "uppercase",
                cursor: loading ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
              }}
            >
              {loading ? (
                "Verifying..."
              ) : (
                <>
                  <LockIcon
                    size={13}
                    color={colors.text.onTint}
                  />
                  Log in
                </>
              )}
            </button>
            </div>
          </form>

          <div
            style={{
              marginTop: spacing.sm,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              variant="caption"
              style={{ color: colors.text.tertiary, fontFamily: monoFont }}
            >
              Not registered yet?
            </Text>
            <Link
              to="/register"
              className="transition-ui hover:scale-[1.02] inline-flex items-center"
              style={{
                gap: 4,
                color: colors.surface.skillhive,
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: monoFont,
                letterSpacing: 0.5,
                textDecoration: "none",
              }}
            >
              Register
              <ArrowUpRight size={12} color={colors.surface.skillhive} />
            </Link>
          </div>

          <Text
            variant="caption"
            style={{
              display: "block",
              marginTop: spacing.xxl,
              color: colors.text.tertiary,
              opacity: 0.7,
              textAlign: "center",
            }}
          >
            By continuing you agree to our Terms &amp; Privacy Policy.
          </Text>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .skillhive-sign-grid {
            grid-template-columns: 1fr !important;
          }
          .skillhive-sign-left {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}