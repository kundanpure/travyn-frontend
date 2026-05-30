import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Public client — used for reading public URLs */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Bucket names used across the app */
export const BUCKETS = {
  AVATARS: "avatars",
  COVERS: "covers",
  CHAT_IMAGES: "chat-images",
} as const;
