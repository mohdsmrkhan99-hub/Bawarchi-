import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logServerError, requestId } from "@/lib/server-errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = requestId(request);
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      success: true,
      data: {
        application: "ok",
        database: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV ?? "unknown",
        runtime: "nodejs",
      },
      requestId: id,
    }, { headers: { "x-request-id": id } });
  } catch (error) {
    logServerError(error, { requestId: id, route: "/api/health" });
    return NextResponse.json({
      success: false,
      error: { code: "DATABASE_UNAVAILABLE", message: "Database connectivity check failed." },
      requestId: id,
    }, { status: 503, headers: { "x-request-id": id } });
  }
}
