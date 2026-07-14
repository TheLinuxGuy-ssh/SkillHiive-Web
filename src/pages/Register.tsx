import { useState, useCallback, type ReactNode } from "react";
import { Link } from "react-router";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Validation ───────────────────────────────────────────────────────────────
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

// score -> tailwind classes (avoids interpolated arbitrary values so Tailwind's
// JIT scanner can always find the full class names in source)
const PW_BAR_ACTIVE_CLASS: Record<number, string> = {
  1: "bg-[#ef4444]",
  2: "bg-[#E8FF47]",
  3: "bg-[#5a9e3a]",
  4: "bg-[#5a9e3a]",
};
const PW_LABEL_CLASS: Record<number, string> = {
  0: "text-[#444442]",
  1: "text-[#ef4444]",
  2: "text-[#E8FF47]",
  3: "text-[#5a9e3a]",
  4: "text-[#5a9e3a]",
};
const PW_LABEL_TEXT: Record<number, string> = {
  0: "",
  1: "Weak",
  2: "Fair",
  3: "Strong",
  4: "Strong",
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
interface ProgressBarProps {
  step: number;
}

function ProgressBar({ step }: ProgressBarProps) {
  const steps = ["IDENTITY", "CREDENTIALS", "CONFIRM"] as const;
  return (
    <div className="flex items-center gap-1.5 px-6 pb-3.5">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        const circleClass = done
          ? "border-[#E8FF47] bg-[#E8FF47] text-black"
          : active
            ? "border-[#E8FF47] bg-transparent text-[#E8FF47]"
            : "border-[#2A2A28] bg-transparent text-[#666664]";
        return (
          <div
            key={label}
            className={`flex items-center gap-1.5 ${i < steps.length - 1 ? "flex-1" : ""}`}
          >
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center text-[8px] transition-all duration-200 shrink-0 ${circleClass}`}
            >
              {done ? "✓" : num}
            </div>
            <span
              className={`text-[8px] tracking-[1.5px] transition-colors duration-200 ${
                active || done ? "text-[#888886]" : "text-[#444442]"
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-[#1E1E1C] mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
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
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  const borderClass =
    error && touched
      ? "border-[#ef4444]"
      : isValid && touched
        ? "border-[#3a6e28]"
        : focused
          ? "border-[#E8FF47]"
          : "border-[#2A2A28]";

  const labelColorClass =
    error && touched
      ? "text-[#ef4444]"
      : focused
        ? "text-[#888886]"
        : "text-[#666664]";

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
        className={`text-[9px] tracking-[1.8px] mb-[5px] block ${labelColorClass}`}
      >
        {label}
      </label>

      <div
        className={`h-12 rounded-[2px] flex items-center px-3 border transition-colors duration-[180ms] ${borderClass} ${
          focused ? "bg-[#0D0D0B]" : "bg-[#0C0C0C]"
        }`}
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
          className="flex-1 bg-transparent border-none outline-none text-[#F0F0EE] font-mono text-[11px] tracking-[0.4px] h-full placeholder:text-[#2E2E2C]"
        />
        {tag && (
          <span className="text-[7px] tracking-[1px] text-[#2E2E2C] shrink-0 ml-1.5">
            {tag}
          </span>
        )}
        {showToggle ? (
          <button
            type="button"
            onClick={onToggleEye}
            aria-label="Toggle password visibility"
            className="bg-transparent border-none cursor-pointer py-0.5 pl-1.5 text-[#666664] flex items-center text-sm transition-colors duration-150 outline-none hover:text-[#888886]"
          >
            {showEye ? "○" : "●"}
          </button>
        ) : (
          isValid &&
          touched && (
            <span className="text-[11px] text-[#5a9e3a] ml-1.5 transition-opacity duration-200">
              ✓
            </span>
          )
        )}
      </div>

      {children}
      <div className="text-[9px] tracking-[0.3px] text-[#ef4444] min-h-[14px] leading-[14px] mt-[3px]">
        {error && touched ? error : ""}
      </div>
    </div>
  );
}

// ─── Password strength meter ──────────────────────────────────────────────────
interface PwMeterProps {
  password: string;
}

function PwMeter({ password }: PwMeterProps) {
  const score = passwordScore(password);
  if (!password) return null;
  return (
    <div className="flex gap-[3px] items-center mt-[5px]">
      {([1, 2, 3, 4] as const).map((i) => (
        <div
          key={i}
          className={`flex-1 h-[2px] rounded-[1px] transition-colors duration-300 ${
            i <= score ? PW_BAR_ACTIVE_CLASS[score] : "bg-[#1E1E1C]"
          }`}
        />
      ))}
      <span
        className={`text-[8px] tracking-[1px] min-w-[38px] text-right transition-colors duration-200 ${PW_LABEL_CLASS[score]}`}
      >
        {PW_LABEL_TEXT[score]}
      </span>
    </div>
  );
}

// ─── Back button ──────────────────────────────────────────────────────────────
interface BackButtonProps {
  onClick?: () => void;
}

function BackButton({ onClick }: BackButtonProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Go back"
      className={`w-[34px] h-[34px] border rounded-[2px] bg-transparent cursor-pointer flex items-center justify-center shrink-0 outline-none transition-all duration-150 ${
        hovered ? "border-[#E8FF47] scale-95" : "border-[#2A2A28] scale-100"
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path
          d="M8 2L3 6.5L8 11"
          stroke="#888886"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// ─── Submit button ────────────────────────────────────────────────────────────
interface SubmitButtonProps {
  loading: boolean;
  onClick: () => void;
}

function SubmitButton({ loading, onClick }: SubmitButtonProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full h-[50px] border border-[#E8FF47] rounded-[2px] flex items-center justify-center gap-2 font-mono outline-none transition-all duration-150 ${
        hovered && !loading
          ? "bg-[rgba(232,255,71,0.14)]"
          : "bg-[rgba(232,255,71,0.07)]"
      } ${loading ? "opacity-70 cursor-not-allowed" : "opacity-100 cursor-pointer"}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-[rgba(232,255,71,0.3)] border-t-[#E8FF47] rounded-full animate-spin" />
      ) : (
        <>
          <span className="text-lg text-[#E8FF47] opacity-40 leading-none">
            [
          </span>
          <span className="text-[11px] font-bold text-[#E8FF47] tracking-[3px]">
            Create account
          </span>
          <div className="flex items-center">
            <div className="w-3.5 h-px bg-[#E8FF47] opacity-50" />
            <div
              className="w-0 h-0 opacity-50"
              style={{
                borderTop: "3px solid transparent",
                borderBottom: "3px solid transparent",
                borderLeft: "5px solid #E8FF47",
              }}
            />
          </div>
          <span className="text-lg text-[#E8FF47] opacity-40 leading-none">
            ]
          </span>
        </>
      )}
    </button>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
interface SuccessScreenProps {
  email: string;
}

function SuccessScreen({ email }: SuccessScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-[52px] text-center gap-3.5">
      <div className="w-14 h-14 border border-[#E8FF47] rounded-full flex items-center justify-center text-[#E8FF47] text-[22px]">
        ✉
      </div>
      <div className="font-['Bebas_Neue',sans-serif] text-[26px] text-[#F0F0EE] tracking-[1px]">
        Check your inbox
      </div>
      <div className="text-[10px] tracking-[0.8px] text-[#666664] leading-[1.9]">
        A confirmation link was sent to
        <br />
        <span className="text-[#E8FF47]">{email}</span>
        <br />
        <br />
        VERIFY YOUR ADDRESS TO ACTIVATE YOUR ACCOUNT
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const ALL_FIELDS: FieldId[] = [
  "displayName",
  "username",
  "email",
  "password",
  "confirm",
];

export default function SignUpScreen({ onBack, onSubmit }: SignUpScreenProps) {
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
  const step2Done =
    step1Done && fieldIsValid("email") && fieldIsValid("password");
  const step3Done = step2Done && fieldIsValid("confirm");
  const progressStep = step3Done ? 4 : step2Done ? 3 : step1Done ? 2 : 1;

  const handleSubmit = useCallback(async () => {
    setTouched(
      Object.fromEntries(ALL_FIELDS.map((f) => [f, true])) as TouchedMap,
    );
    if (ALL_FIELDS.some((id) => validateField(id, values))) return;

    setLoading(true);
    setSubmitErr(null);

    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        // Default: wire your Supabase call here
        // const { error } = await supabase.auth.signUp({
        //   email: values.email.trim(),
        //   password: values.password,
        //   options: {
        //     data: {
        //       username:    values.username.trim().toLowerCase(),
        //       displayname: values.displayName.trim(),
        //     },
        //   },
        // });
        // if (error) throw error;
        await new Promise<void>((r) => setTimeout(r, 1100));
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitErr(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [values, onSubmit]);

  if (submitted) {
    return (
      <div className="bg-black font-mono rounded-xl overflow-hidden max-w-[660px] mx-auto min-h-[520px]">
        <SuccessScreen email={values.email.trim()} />
      </div>
    );
  }

  return (
    <div className="bg-black font-mono rounded-xl overflow-hidden max-w-[660px] mx-auto min-h-[520px] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #0C0C0C inset;
          -webkit-text-fill-color: #F0F0EE;
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-3.5 pb-3">
        <BackButton onClick={onBack} />
        <div className="flex items-center gap-1.5">
          <div className="w-[5px] h-[5px] rounded-full bg-[#E8FF47]" />
          <span className="text-[9px] tracking-[2.5px] text-[#666664]">
            AUTH MODULE
          </span>
        </div>
        <div className="w-[34px]" />
      </div>

      {/* Progress */}
      <ProgressBar step={progressStep} />
      <div className="h-px bg-[#1E1E1C] mx-6" />

      {/* Hero */}
      <div className="flex items-center gap-[18px] px-6 pt-3.5 pb-[18px]">
        <div className="w-[54px] h-[54px] shrink-0 relative flex items-center justify-center">
          <div className="absolute w-[62px] h-[62px] rounded-full border border-[#2A2A28]" />
          <div className="w-[54px] h-[54px] rounded-full border border-[#2A2A28] bg-[#0C0C0C] flex items-center justify-center relative z-10">
            <span className="font-mono text-xs font-bold text-[#F0F0EE] tracking-[3px]">
              SH
            </span>
          </div>
          <div className="absolute top-px right-px w-[9px] h-[9px] rounded-full bg-[#E8FF47] border-2 border-black z-20" />
        </div>
        <div>
          <div className="font-['Bebas_Neue',sans-serif] text-[28px] text-[#F0F0EE] tracking-[1px] leading-[1.1]">
            Create account
          </div>
          <div className="text-[9px] tracking-[2px] text-[#666664] mt-1">
            JOIN THE SKILLHIVE NETWORK
          </div>
        </div>
      </div>
      <div className="h-px bg-[#1E1E1C] mx-6" />

      {/* Form */}
      <div className="px-6 pt-[18px] flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <Field
            id="displayName"
            label="Display name"
            tag="ID"
            placeholder="Aryan Kapoor"
            value={values.displayName}
            onChange={(v) => set("displayName", v)}
            onBlur={() => touch("displayName")}
            error={errors.displayName}
            isValid={fieldIsValid("displayName")}
            touched={touched.displayName}
          />
          <Field
            id="username"
            label="Username"
            tag="@"
            placeholder="aryankapoor"
            value={values.username}
            onChange={(v) => set("username", v)}
            onBlur={() => touch("username")}
            error={errors.username}
            isValid={fieldIsValid("username")}
            touched={touched.username}
          />
        </div>

        <div className="grid grid-cols-1 gap-3.5">
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
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
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
          >
            <PwMeter password={values.password} />
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
          />
        </div>
      </div>

      {/* Submit error */}
      {submitErr && (
        <div className="px-6 pt-2.5 text-[9px] text-[#ef4444] tracking-[0.3px]">
          {submitErr}
        </div>
      )}

      {/* CTA */}
      <div className="px-6 pt-[18px]">
        <SubmitButton loading={loading} onClick={handleSubmit} />
      </div>

      {/* Footer */}
      <div className="px-6 pt-4 flex flex-col gap-3.5">
        <div className="h-px bg-[#1E1E1C]" />
        <div className="flex justify-center items-center">
          <span className="text-[9px] tracking-[1.2px] text-[#666664]">
            Already have an account?
          </span>
          <Link
            to="/login"
            className="ml-2 text-xs tracking-widest text-lime-300"
          >
            Log In
          </Link>
        </div>
      </div>

      <div className="text-[9px] tracking-[0.2px] text-[#333331] text-center leading-4 px-8 pt-3.5 pb-5">
        By creating an account you agree to our{" "}
        <a href="/terms" className="text-[#666664] no-underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-[#666664] no-underline">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}
