import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

// Protege el panel de administración. Deja pasar la página de login y sus assets.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas dentro de /admin
  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";

  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protege /admin y las APIs de administración (salvo el login, filtrado arriba).
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
