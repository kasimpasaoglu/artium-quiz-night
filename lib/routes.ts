export const ROUTES = {
  adminHome: "/quiz-admin",
  adminLogin: "/quiz-admin/login",
  adminSettings: "/quiz-admin/settings",
  adminQuizNew: "/quiz-admin/quizzes/new",
  adminQuizDetail: (id: string) => `/quiz-admin/quizzes/${id}`,
  adminQuizEdit: (id: string) => `/quiz-admin/quizzes/${id}/edit`,
} as const;

export const API_ROUTES = {
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  upload: "/api/upload",
} as const;

const ADMIN_PREFIX = ROUTES.adminHome;

// Open-redirect koruması: `next` query parametresi yalnızca admin altındaki
// göreceli yollara izin verir; `//host` (protocol-relative), `http://`,
// veya backslash gibi vektörler reddedilir.
export function safeAdminNext(next: string | undefined | null): string {
  if (!next) return ADMIN_PREFIX;
  if (next.startsWith("//") || next.startsWith("\\")) return ADMIN_PREFIX;
  if (!next.startsWith("/")) return ADMIN_PREFIX;
  if (next !== ADMIN_PREFIX && !next.startsWith(`${ADMIN_PREFIX}/`)) {
    return ADMIN_PREFIX;
  }
  return next;
}
