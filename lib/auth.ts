import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export type UserRole = "admin" | "user";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}

// Función para limpiar sesiones corruptas
export async function clearCorruptedSession() {
  try {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      // Limpiar localStorage por si hay datos corruptos
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error("Error clearing session:", error);
  }
}

// Función para obtener el perfil del usuario con su rol
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      // Si el perfil no existe, es un error crítico
      if (error.code === "PGRST116") {
        console.error("User profile not found for user:", userId);
        await clearCorruptedSession();
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error in getUserProfile:", error);
    return null;
  }
}

// Función para login
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Función para logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

// Función para registrar usuario (solo admin puede hacer esto)
export async function signUp(
  email: string,
  password: string,
  role: UserRole = "user",
  fullName?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  // Crear perfil del usuario
  if (data.user) {
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: data.user.id,
        email: data.user.email,
        role,
        full_name: fullName,
      });

    if (profileError) {
      throw profileError;
    }
  }

  return data;
}
