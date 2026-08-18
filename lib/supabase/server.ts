import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

// Cliente de Supabase para Server Components. Usa las cookies de la
// request para mantener la sesión de Supabase Auth y así que las
// políticas de RLS se evalúen con el auth.uid() correcto.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // El set puede fallar si se llama desde un Server Component
            // renderizado de forma estática. El middleware se encarga
            // de refrescar la sesión en ese caso.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Idem caso anterior.
          }
        },
      },
    }
  );
}
