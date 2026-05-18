import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === ROUTES.adminLogin) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.adminLogin;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/quiz-admin/:path*", "/api/admin/:path*"],
};
