import { NextResponse } from "next/server";

/**
 * Server-side health proxy — avoids CORS issues when the browser
 * tries to ping the Render backend directly.
 * The frontend calls /api/health (same origin), and this route
 * calls the backend from the server side where CORS doesn't apply.
 */
export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
  
  // Use URL parsing to get the base domain reliably
  let healthUrl;
  try {
    const origin = new URL(apiUrl).origin;
    healthUrl = `${origin}/actuator/health`;
  } catch {
    // Fallback if URL parsing fails
    healthUrl = apiUrl.replace("/api/v1", "") + "/actuator/health";
  }

  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store", // never cache on the server side
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      return NextResponse.json(
        { status: "UP" },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }
  } catch {
    // timeout or connection refused — backend still waking up
  }

  return NextResponse.json(
    { status: "DOWN" },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}
