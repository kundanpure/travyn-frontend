import { NextResponse } from "next/server";

/**
 * Server-side health proxy — avoids CORS issues when the browser
 * tries to ping the Render backend directly.
 * The frontend calls /api/health (same origin), and this route
 * calls the backend from the server side where CORS doesn't apply.
 */
export async function GET() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
  const healthUrl = apiUrl.replace("/api/v1", "/actuator/health");

  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      next: { revalidate: 0 }, // never cache — always fresh
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      return NextResponse.json({ status: "UP" }, { status: 200 });
    }
    return NextResponse.json({ status: "DOWN" }, { status: 503 });
  } catch {
    return NextResponse.json({ status: "DOWN" }, { status: 503 });
  }
}
