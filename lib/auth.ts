import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

export const SESSION_COOKIE_NAME = "quiz_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 saat

const SECRET = new TextEncoder().encode(env.SESSION_SECRET);

const sessionCookieOptions = {
  httpOnly: true as const,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/" as const,
};

type CookieJar = {
  set: (name: string, value: string, options: Record<string, unknown>) => unknown;
};

export function setSessionCookie(cookies: CookieJar, token: string) {
  cookies.set(SESSION_COOKIE_NAME, token, {
    ...sessionCookieOptions,
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(cookies: CookieJar) {
  cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}
