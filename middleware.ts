import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  // Handle preflight OPTIONS requests for CORS
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  let token = request.cookies.get("auth_token")?.value;

  // Also check Authorization header for mobile/API support
  const authHeader = request.headers.get("authorization");
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  let user = null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET_KEY;
      if (secret) {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        user = payload;
      }
    } catch (error) {
      // Invalid token
    }
  }

  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isAppRoute = request.nextUrl.pathname.startsWith("/app");

  // Define public API routes that don't need auth
  const publicApiPaths = ["/api/auth", "/api/vendors/apply", "/api/sos/trigger"]; // added trigger if public

  if (!user) {
    if (isApiRoute && !publicApiPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isAppRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      return NextResponse.redirect(url);
    }
  }

  // Add CORS headers to all successful responses
  const response = NextResponse.next();
  if (isApiRoute) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
