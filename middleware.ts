import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
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

  // Protect /app/* routes — redirect to /auth if not logged in
  if (!user && request.nextUrl.pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
