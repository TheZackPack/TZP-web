import { getWebSession } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";

export async function requireWebSession() {
  if (!hasDatabase()) {
    return { error: jsonError("DATABASE_URL is not configured", 503), session: null };
  }

  const session = await getWebSession();
  if (!session) {
    return { error: jsonError("Authentication required", 401), session: null };
  }

  return { error: null, session };
}
