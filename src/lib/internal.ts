import { jsonError } from "@/lib/http";

export function requireInternalBearer(headers: Headers) {
  const expected = process.env.TZP_INTERNAL_API_TOKEN;
  if (!expected) {
    return jsonError("Internal API is not configured", 503);
  }

  const actual = headers.get("authorization");
  if (actual !== `Bearer ${expected}`) {
    return jsonError("Unauthorized", 401);
  }

  return null;
}
