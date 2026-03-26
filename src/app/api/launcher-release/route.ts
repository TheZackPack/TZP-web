export async function GET() {
  const { GET: getRelease } = await import("@/app/api/launcher/release/route");
  return getRelease();
}
