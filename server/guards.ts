import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/db/prisma";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

// `cache` aynı RSC render boyunca tekrar çağrıları dedupe eder; PanelLayout
// ve alt sayfaların ikisi de `requireAdmin()` çağırınca tek Prisma hit'i olur.
export const requireAdmin = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    redirect(ROUTES.adminLogin);
  }

  const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
  if (!user) {
    redirect(ROUTES.adminLogin);
  }

  return user;
});
