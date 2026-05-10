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
  const publicApiPaths = ["/api/auth", "/api/vendors/apply", "/api/sos/trigger", "/api/attorneys", "/api/contact"]; // added trigger if public

  if (!user) {
    if (isApiRoute && !publicApiPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isAppRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      return NextResponse.redirect(url);
    }
  } else {
    // Redirect logged in users away from /auth
    if (request.nextUrl.pathname.startsWith("/auth")) {
      const url = request.nextUrl.clone();
      if (user.role === "ADMIN") url.pathname = "/app/admin";
      else if (user.role === "ATTORNEY") url.pathname = "/app/attorney";
      else url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    if (request.nextUrl.pathname === "/app/messages" && user.role === "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    // Protect /app/admin routes
    if ((request.nextUrl.pathname === "/app/admin" || request.nextUrl.pathname.startsWith("/app/admin/")) && user.role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    // Protect /app/attorney routes
    if ((request.nextUrl.pathname === "/app/attorney" || request.nextUrl.pathname.startsWith("/app/attorney/")) && user.role !== "ATTORNEY") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    // Redirect admins and attorneys away from the generic /app dashboard
    if (request.nextUrl.pathname === "/app") {
      if (user.role === "ATTORNEY") {
        const url = request.nextUrl.clone();
        url.pathname = "/app/attorney";
        return NextResponse.redirect(url);
      }
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
  matcher: ["/app/:path*", "/api/:path*", "/auth/:path*"],
};
