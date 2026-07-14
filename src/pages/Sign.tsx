import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";

export default function Sign() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
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
      alert(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl text-zinc-100 mb-2">Sign in to SkillHive</h1>

          <p className="text-xs tracking-[0.3em] text-zinc-500">
            IDENTITY VERIFICATION REQUIRED
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest text-zinc-500 mb-2">
              EMAIL ADDRESS
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 bg-zinc-950 border border-zinc-800 px-4 text-zinc-100 outline-none focus:border-lime-300"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest text-zinc-500 mb-2">
              PASSWORD
            </label>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 bg-zinc-950 border border-zinc-800 px-4 text-zinc-100 outline-none focus:border-lime-300"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs tracking-widest text-zinc-500 hover:text-zinc-300"
            >
              FORGOT ACCESS?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 border border-lime-300 text-lime-300 tracking-[0.3em] hover:bg-lime-300/10 transition"
          >
            {loading ? "LOADING..." : "LOG IN"}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
          <span className="text-xs tracking-widest text-zinc-500">
            NO ACCESS?
          </span>

          <Link
            to="/register"
            className="ml-2 text-xs tracking-widest text-lime-300"
          >
            REGISTER
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
