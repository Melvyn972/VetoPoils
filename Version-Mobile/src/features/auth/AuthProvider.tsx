import type { Session, User } from "@supabase/supabase-js";
import { createContext, PropsWithChildren, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database.types";

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function safeLoadProfile(userId: string) {
  try {
    return await loadProfile(userId);
  } catch (error) {
    console.warn("Impossible de charger le profil utilisateur", error);
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = async () => {
    if (!session?.user.id) {
      setProfile(null);
      return;
    }

    const nextProfile = await safeLoadProfile(session.user.id);
    setProfile(nextProfile);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user.id) {
        setProfile(await safeLoadProfile(data.session.user.id));
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession?.user.id) {
          setProfile(await safeLoadProfile(nextSession.user.id));
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [loading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
