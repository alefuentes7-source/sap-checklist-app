"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/clientes");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-card border border-line bg-surface p-8 shadow-sm"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Checklists SAP
        </p>
        <h1 className="mt-2 font-display text-2xl font-medium text-ink">
          Iniciar sesión
        </h1>

        <label className="mt-6 block text-sm font-medium text-ink-soft">
          Correo
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-ink-soft">
          Contraseña
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>

        {error && (
          <p className="mt-4 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-ink py-2 font-medium text-white transition hover:bg-accent disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
