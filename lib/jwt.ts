import { SignJWT, jwtVerify } from "jose";

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error("JWT_SECRET_KEY is not set in environment variables.");
  }
  return new TextEncoder().encode(secret);
};

export async function signJwt(payload: Record<string, unknown>, expiresIn: string = "7d") {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecretKey());

  return token;
}

import { cookies } from "next/headers";

export async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getAuthToken(req?: Request) {
  // 1. Check cookies (Standard for Web)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) return token;
  } catch (e) {
    // cookies() might fail if not in a request context
  }

  // 2. Check Authorization Header (Standard for Mobile/API)
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }
  }

  return null;
}
