import { supabase } from "@/lib/supabase";

export type RegisterPayload = {
  email: string;
  password: string;
  nom: string;
  prenom: string;
};

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(payload: RegisterPayload) {
  return supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        nom: payload.nom,
        prenom: payload.prenom,
      },
    },
  });
}
