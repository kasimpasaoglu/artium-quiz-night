import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { setSessionCookie, signSession } from "@/lib/auth";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/schemas/auth";

const invalidCredentials = () =>
  NextResponse.json({ title: "Geçersiz kullanıcı adı veya şifre", status: 401 }, { status: 401 });

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { title: "Gönderilen veri JSON olarak okunamadı", status: 400 },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ title: "Geçersiz istek gövdesi", status: 400 }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({
    where: { username: parsed.data.username },
  });

  // Kullanıcı yoksa bile bcrypt karşılaştırması çalıştırılır; aksi halde
  // tepki süresi farkı "kullanıcı adı var/yok" enumeration'a yol açar.
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !ok) {
    return invalidCredentials();
  }

  const token = await signSession(user.id);
  const response = NextResponse.json({ ok: true });
  setSessionCookie(response.cookies, token);
  return response;
}
