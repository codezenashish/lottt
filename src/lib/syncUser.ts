import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export const getOrCreateDbUser = cache(async () => {
  // Check Authorization header for Bearer API Key (used by Chrome Extension and CLI)
  try {
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const apiKey = authHeader.substring(7).trim();
      if (apiKey) {
        const userByApiKey = await db.query.users.findFirst({
          where: eq(users.apiKey, apiKey),
        });
        if (userByApiKey) {
          return userByApiKey;
        }
      }
    }
  } catch {
    // Ignore error if headers() is unavailable in non-request contexts
  }

  // Fallback to Supabase session authentication
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  const supabaseUser = session?.user;

  if (error || !supabaseUser) {
    return null;
  }

  // Check if user already exists to avoid expensive UPSERT
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, supabaseUser.id),
  });

  if (existingUser) {
    return existingUser;
  }

  const name =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split("@")[0] ||
    "User";
  const image = supabaseUser.user_metadata?.avatar_url || null;
  const email = supabaseUser.email || "";

  const [dbUser] = await db
    .insert(users)
    .values({
      id: supabaseUser.id,
      email,
      name,
      image,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        name,
        image,
      },
    })
    .returning();

  return dbUser;
});

