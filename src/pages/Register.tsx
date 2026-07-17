import { useState, useCallback, type ReactNode } from "react";
import { Link } from "react-router";
import { supabase } from "@/lib/supabase";
import { useTokens } from "@/theme";
import { Text } from "@/components/ui";

/* ---------------------------------- Types --------------------------------- */

type FieldId = "displayName" | "username" | "email" | "password" | "confirm";

interface FormValues {
  displayName: string;
  username: string;
  email: string;
  password: string;
  confirm: string;
}

type TouchedMap = Partial<Record<FieldId, boolean>>;
type ErrorMap = Record<FieldId, string | null>;

export interface SignUpScreenProps {
  onBack?: () => void;
  onSubmit?: (values: FormValues) => Promise<void>;
}

type Tokens = ReturnType<typeof useTokens>;

/* -------------------------------- Validation ------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(id: FieldId, values: FormValues): string | null {
  switch (id) {
    case "displayName":
      return values.displayName.trim() ? null : "Enter your display name.";
    case "username":
      return values.username.trim() ? null : "Pick a username.";
    case "email":
      return EMAIL_RE.test(values.email.trim())
        ? null
        : "Enter a valid email address.";
    case "password": {
      const pw = values.password;
      if (pw.length < 8) return "At least 8 characters required.";
      if (!/[A-Z]/.test(pw)) return "Add an uppercase letter.";
      if (!/[0-9]/.test(pw)) return "Add a number.";
      return null;
    }
    case "confirm":
      return values.confirm === values.password
        ? null
        : "Passwords don't match.";
  }
}

function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const PW_LABEL_TEXT: Record<number, string> = {
  0: "",
  1: "Weak",
  2: "Fair",
  3: "Strong",
  4: "Strong",
};

const monoFont =
  'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace';

/* -------------------------------- Progress bar ------------------------------ */

function ProgressBar({ step, colors }: { step: number; colors: Tokens["colors"] }) {
  const steps = ["IDENTITY", "CREDENTIALS", "CONFIRM"] as const;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {steps.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        const circleColor = done || active ? colors.surface.skillhive : colors.border.subtle;
        return (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flex: i < steps.length - 1 ? 1 : "none",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `1px solid ${circleColor}`,
                background: done ? colors.surface.skillhive : "transparent",
                color: done
                  ? colors.text.onTint
                  : active
                    ? colors.surface.skillhive
                    : colors.text.tertiary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                fontFamily: monoFont,
                flexShrink: 0,
                transition: "all 180ms ease",
              }}
            >
              {done ? "✓" : num}
            </div>
            <span
              style={{
                fontSize: 8,
                letterSpacing: 1.5,
                fontFamily: monoFont,
                color: active || done ? colors.text.secondary : colors.text.tertiary,
              }}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: colors.border.subtle, margin: "0 4px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------- Field ---------------------------------- */

interface FieldProps {
  id: FieldId;
  label: string;
  tag?: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error: string | null;
  isValid: boolean;
  touched: boolean | undefined;
  showToggle?: boolean;
  showEye?: boolean;
  onToggleEye?: () => void;
  children?: ReactNode;
  colors: Tokens["colors"];
  radii: Tokens["radii"];
}

function Field({
  id,
  label,
  tag,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  isValid,
  touched,
  showToggle,
  showEye,
  onToggleEye,
  children,
  colors,
  radii,
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor =
    error && touched
      ? colors.tint.danger
      : isValid && touched
        ? colors.tint.success
        : focused
          ? colors.surface.skillhive
          : colors.border.subtle;

  const labelColor =
    error && touched ? colors.tint.danger : focused ? colors.text.secondary : colors.text.tertiary;

  const autoComplete =
    id === "password" || id === "confirm"
      ? "new-password"
      : id === "email"
        ? "email"
        : id === "username"
          ? "username"
          : "on";

  return (
    <div>
      <label
        htmlFor={id}
        style={{
          fontSize: 9,
          letterSpacing: 1.8,
          marginBottom: 5,
          display: "block",
          fontFamily: monoFont,
          color: labelColor,
        }}
      >
        {label}
      </label>

      <div
        style={{
          height: 48,
          borderRadius: radii.sm ?? radii.md,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          border: `1px solid ${borderColor}`,
          background: focused ? colors.surface.secondary : colors.surface.primary,
          transition: "border-color 180ms ease, background 180ms ease",
        }}
      >
        <input
          id={id}
          type={showToggle ? (showEye ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: colors.text.primary,
            fontFamily: monoFont,
            fontSize: 11,
            letterSpacing: 0.4,
            height: "100%",
          }}
        />
        {tag && (
          <span
            style={{
              fontSize: 7,
              letterSpacing: 1,
              color: colors.text.tertiary,
              opacity: 0.6,
              flexShrink: 0,
              marginLeft: 6,
              fontFamily: monoFont,
            }}
          >
            {tag}
          </span>
        )}
        {showToggle ? (
          <button
            type="button"
            onClick={onToggleEye}
            aria-label="Toggle password visibility"
            className="transition-ui hover:!text-white"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "2px 0 2px 6px",
              color: colors.text.tertiary,
              display: "flex",
              alignItems: "center",
              fontSize: 14,
            }}
          >
            {showEye ? "○" : "●"}
          </button>
        ) : (
          isValid &&
          touched && (
            <span style={{ fontSize: 11, color: colors.tint.success, marginLeft: 6 }}>✓</span>
          )
        )}
      </div>

      {children}
      <div
        style={{
          fontSize: 9,
          letterSpacing: 0.3,
          color: colors.tint.danger,
          minHeight: 14,
          lineHeight: "14px",
          marginTop: 3,
          fontFamily: monoFont,
        }}
      >
        {error && touched ? error : ""}
      </div>
    </div>
  );
}

/* ------------------------------ Password meter ------------------------------ */

function PwMeter({ password, colors }: { password: string; colors: Tokens["colors"] }) {
  const score = passwordScore(password);
  if (!password) return null;

  const barColor =
    score <= 1 ? colors.tint.danger : score === 2 ? colors.surface.skillhive : colors.tint.success;
  const labelColor = score === 0 ? colors.text.tertiary : barColor;

  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", marginTop: 5 }}>
      {([1, 2, 3, 4] as const).map((i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 2,
            borderRadius: 1,
            background: i <= score ? barColor : colors.border.subtle,
            transition: "background 300ms ease",
          }}
        />
      ))}
      <span
        style={{
          fontSize: 8,
          letterSpacing: 1,
          minWidth: 38,
          textAlign: "right",
          color: labelColor,
          fontFamily: monoFont,
        }}
      >
        {PW_LABEL_TEXT[score]}
      </span>
    </div>
  );
}

/* -------------------------------- Back button -------------------------------- */

function BackButton({ onClick, colors, radii }: { onClick?: () => void; colors: Tokens["colors"]; radii: Tokens["radii"] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Go back"
      style={{
        width: 34,
        height: 34,
        borderRadius: radii.sm ?? radii.md,
        border: `1px solid ${hovered ? colors.surface.skillhive : colors.border.subtle}`,
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transform: hovered ? "scale(0.95)" : "scale(1)",
        transition: "all 150ms ease",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path
          d="M8 2L3 6.5L8 11"
          stroke={colors.text.secondary}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/* -------------------------------- Submit button ------------------------------- */

function SubmitButton({
  loading,
  onClick,
  colors,
  radii,
}: {
  loading: boolean;
  onClick: () => void;
  colors: Tokens["colors"];
  radii: Tokens["radii"];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="transition-ui hover:scale-[1.01] active:scale-[0.99]"
      style={{
        width: "100%",
        height: 50,
        borderRadius: radii.md,
        border: `1px solid ${colors.surface.skillhive}`,
        background: loading ? "transparent" : colors.surface.skillhive,
        color: loading ? colors.surface.skillhive : colors.text.onTint,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: monoFont,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.85 : 1,
      }}
    >
      {loading ? (
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: `2px solid ${colors.text.onTint}55`,
            borderTopColor: colors.text.onTint,
            animation: "skillhive-spin 700ms linear infinite",
          }}
        />
      ) : (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Create account
        </span>
      )}
    </button>
  );
}

/* -------------------------------- Success screen ------------------------------ */

function SuccessScreen({ email, colors }: { email: string; colors: Tokens["colors"] }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 14,
        minHeight: "60vh",
        padding: "0 32px",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: `1px solid ${colors.surface.skillhive}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.surface.skillhive,
          fontSize: 22,
        }}
      >
        ✉
      </div>
      <Text as="h2" variant="headline" style={{ color: colors.text.primary }}>
        Check your inbox
      </Text>
      <Text
        variant="bodySm"
        style={{ color: colors.text.tertiary, lineHeight: 1.9, fontFamily: monoFont, fontSize: 10 }}
      >
        A confirmation link was sent to
        <br />
        <span style={{ color: colors.surface.skillhive }}>{email}</span>
        <br />
        <br />
        VERIFY YOUR ADDRESS TO ACTIVATE YOUR ACCOUNT
      </Text>
    </div>
  );
}

/* ---------------------------------- Main ------------------------------------ */

const ALL_FIELDS: FieldId[] = ["displayName", "username", "email", "password", "confirm"];

export default function SignUpScreen({ onBack, onSubmit }: SignUpScreenProps) {
  const { colors, spacing, radii, typography } = useTokens();

  const [values, setValues] = useState<FormValues>({
    displayName: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [touched, setTouched] = useState<TouchedMap>({});
  const [showPw, setShowPw] = useState(false);
  const [showCo, setShowCo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const set = useCallback((field: FieldId, val: string) => {
    setValues((v) => ({ ...v, [field]: val }));
  }, []);

  const touch = useCallback((field: FieldId) => {
    setTouched((t) => ({ ...t, [field]: true }));
  }, []);

  const errors: ErrorMap = Object.fromEntries(
    ALL_FIELDS.map((id) => [id, validateField(id, values)]),
  ) as ErrorMap;

  const fieldIsValid = (id: FieldId) => !errors[id];

  const step1Done = fieldIsValid("displayName") && fieldIsValid("username");
  const step2Done = step1Done && fieldIsValid("email") && fieldIsValid("password");
  const step3Done = step2Done && fieldIsValid("confirm");
  const progressStep = step3Done ? 4 : step2Done ? 3 : step1Done ? 2 : 1;

  const sectionLabel: React.CSSProperties = {
    fontSize: typography.label.size,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.text.tertiary,
    fontWeight: typography.label.weight,
    fontFamily: monoFont,
  };

  const handleSubmit = useCallback(async () => {
    setTouched(Object.fromEntries(ALL_FIELDS.map((f) => [f, true])) as TouchedMap);
    if (ALL_FIELDS.some((id) => validateField(id, values))) return;

    setLoading(true);
    setSubmitErr(null);

    try {
      if (onSubmit) {
        await onSubmit(values);
        setSubmitted(true);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: {
            data: {
              username: values.username.trim().toLowerCase(),
              displayname: values.displayName.trim(),
            },
          },
        });
        if (error) throw error;
        if (!data.user) throw new Error("No user returned.");

        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username: values.username.trim(),
          displayname: values.displayName.trim(),
          avatar: null,
          created_at: new Date().toISOString(),
        });
        if (profileError) console.warn(profileError.message);

        if (!data.session) setSubmitted(true);
      }
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [values, onSubmit]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        background: colors.bg.primary ?? colors.surface.primary,
      }}
      className="skillhive-signup-grid"
    >
      <style>{`
        @keyframes skillhive-spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .skillhive-signup-grid { grid-template-columns: 1fr !important; }
          .skillhive-signup-left { display: none !important; }
        }
      `}</style>

      {/* Left: brand panel — matches Sign.tsx */}
      <div
        className="skillhive-signup-left"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: spacing.xxxl,
          borderRight: `1px solid ${colors.border.subtle}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(${colors.border.subtle} 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />
        <div className="flex flex-col justify-center items-center h-full" style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
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
              skillhive
            </Text>
          </div>

          <Text
            as="h1"
            variant="headline"
            style={{
              color: colors.text.primary,
              marginTop: spacing.xxl,
              lineHeight: `${typography.headline.lineHeight}px`,
              letterSpacing: typography.headline.letterSpacing,
              maxWidth: 420,
            }}
          >
            Join the network.
          </Text>
          <Text
            variant="bodyLg"
            style={{
              display: "block",
              marginTop: spacing.base,
              maxWidth: 380,
              color: colors.text.secondary,
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            An account here is a seat in the room — no leaderboards, no
            streaks, just the people you're already building alongside.
          </Text>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: spacing.sm }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: colors.tint.success,
              opacity: 0.8,
            }}
          />
          <Text variant="caption" style={{ color: colors.text.tertiary, fontFamily: monoFont }}>
            open source · built in the open
          </Text>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: spacing.xxl }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          {submitted ? (
            <SuccessScreen email={values.email.trim()} colors={colors} />
          ) : (
            <>

              {/* <ProgressBar step={progressStep} colors={colors} /> */}

              <div style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
                <Text
                  as="h2"
                  variant="headline"
                  style={{
                    color: colors.text.primary,
                    lineHeight: `${typography.headline.lineHeight}px`,
                  }}
                >
                  Create account
                </Text>
                <Text
                  variant="caption"
                  style={{
                    color: colors.text.tertiary,
                    fontFamily: monoFont,
                    letterSpacing: 2,
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  JOIN THE SKILLHIVE NETWORK
                </Text>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
                  <Field
                    id="displayName"
                    label="Display name"
                    tag="ID"
                    placeholder="Your Name"
                    value={values.displayName}
                    onChange={(v) => set("displayName", v)}
                    onBlur={() => touch("displayName")}
                    error={errors.displayName}
                    isValid={fieldIsValid("displayName")}
                    touched={touched.displayName}
                    colors={colors}
                    radii={radii}
                  />
                  <Field
                    id="username"
                    label="Username"
                    tag="@"
                    placeholder="Your Username"
                    value={values.username}
                    onChange={(v) => set("username", v)}
                    onBlur={() => touch("username")}
                    error={errors.username}
                    isValid={fieldIsValid("username")}
                    touched={touched.username}
                    colors={colors}
                    radii={radii}
                  />
                </div>

                <Field
                  id="email"
                  label="Email address"
                  tag="REQ"
                  type="email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={(v) => set("email", v)}
                  onBlur={() => touch("email")}
                  error={errors.email}
                  isValid={fieldIsValid("email")}
                  touched={touched.email}
                  colors={colors}
                  radii={radii}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
                  <Field
                    id="password"
                    label="Password"
                    placeholder="Min 8 characters"
                    value={values.password}
                    onChange={(v) => set("password", v)}
                    onBlur={() => touch("password")}
                    error={errors.password}
                    isValid={fieldIsValid("password")}
                    touched={touched.password}
                    showToggle
                    showEye={showPw}
                    onToggleEye={() => setShowPw((p) => !p)}
                    colors={colors}
                    radii={radii}
                  >
                    <PwMeter password={values.password} colors={colors} />
                  </Field>
                  <Field
                    id="confirm"
                    label="Confirm password"
                    placeholder="Repeat password"
                    value={values.confirm}
                    onChange={(v) => set("confirm", v)}
                    onBlur={() => touch("confirm")}
                    error={errors.confirm}
                    isValid={fieldIsValid("confirm")}
                    touched={touched.confirm}
                    showToggle
                    showEye={showCo}
                    onToggleEye={() => setShowCo((p) => !p)}
                    colors={colors}
                    radii={radii}
                  />
                </div>

                {submitErr && (
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
                  >
                    <Text
                      variant="caption"
                      style={{ color: colors.tint.danger, fontFamily: monoFont }}
                    >
                      {submitErr}
                    </Text>
                  </div>
                )}

                <SubmitButton loading={loading} onClick={handleSubmit} colors={colors} radii={radii} />
              </div>

              <div
                style={{
                  marginTop: spacing.xxl,
                  paddingTop: spacing.xl,
                  borderTop: `1px solid ${colors.border.subtle}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="caption" style={{ color: colors.text.tertiary, fontFamily: monoFont }}>
                  Already have an account?
                </Text>
                <Link
                  to="/login"
                  className="transition-ui hover:scale-[1.02]"
                  style={{
                    color: colors.surface.skillhive,
                    fontSize: 12.5,
                    fontWeight: 700,
                    fontFamily: monoFont,
                    letterSpacing: 0.5,
                    textDecoration: "none",
                  }}
                >
                  Log in
                </Link>
              </div>

              <Text
                variant="caption"
                style={{
                  display: "block",
                  marginTop: spacing.xl,
                  color: colors.text.tertiary,
                  opacity: 0.7,
                  textAlign: "center",
                }}
              >
                By creating an account you agree to our Terms &amp; Privacy Policy.
              </Text>
            </>
          )}
        </div>
      </div>
    </div>
  );
}