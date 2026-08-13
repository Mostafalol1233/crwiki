import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

type SafeResult<T> = { data: T; error: null; count?: number };

/**
 * Provides a chainable, read-safe Supabase substitute when public environment
 * variables are unavailable. This keeps public routes renderable in local and
 * preview builds while returning empty data instead of exposing credentials.
 */
function createSafeQuery(): any {
  const listResult: SafeResult<unknown[]> = { data: [], error: null, count: 0 };
  const singleResult: SafeResult<null> = { data: null, error: null };

  let query: any;
  const target = (): any => query;
  query = new Proxy(target, {
    apply: () => query,
    get: (_target, property) => {
      if (property === "then") {
        return (resolve: (value: SafeResult<unknown[]>) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(listResult).then(resolve, reject);
      }
      if (property === "catch") return (reject: (reason: unknown) => unknown) => Promise.resolve(listResult).catch(reject);
      if (property === "single" || property === "maybeSingle") return async () => singleResult;
      if (property === "throwOnError") return () => query;
      if (property === Symbol.toStringTag) return "SafeSupabaseQuery";
      return (..._args: unknown[]) => query;
    },
  });

  return query;
}

function createSafeClient() {
  if (!isSupabaseConfigured) {
    const emptySession = { data: { session: null }, error: null };
    const emptyUser = { data: { user: null }, error: null };
    const emptySuccess = { data: null, error: null };

    return {
      from: () => createSafeQuery(),
      rpc: async () => emptySuccess,
      auth: {
        getSession: async () => emptySession,
        getUser: async () => emptyUser,
        signUp: async () => emptySuccess,
        signInWithPassword: async () => emptySuccess,
        signInWithOAuth: async () => emptySuccess,
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ error: null }),
        updateUser: async () => emptyUser,
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      },
      storage: { from: () => createSafeQuery() },
    } as any;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabase = createSafeClient();
