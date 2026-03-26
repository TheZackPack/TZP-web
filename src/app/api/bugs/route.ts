import { NextRequest } from "next/server";

import { POST as createBugReport } from "@/app/api/reports/bugs/route";

export async function POST(request: NextRequest) {
  return createBugReport(request);
}
