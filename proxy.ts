import { NextResponse } from "next/server";

export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/quiz-admin/:path*", "/api/admin/:path*"],
};
