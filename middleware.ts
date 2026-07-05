import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Rutas públicas
  const publicRoutes = ["/login"];
  if (publicRoutes.includes(pathname)) return NextResponse.next();

  // Sin sesión → login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Rutas solo para superadmin
  const superadminRoutes = ["/empresas", "/superadmin"];
  if (superadminRoutes.some((r) => pathname.startsWith(r))) {
    if (session.user && (session.user as any).rol !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Rutas solo para admin o superadmin
  const adminRoutes = ["/usuarios"];
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    const rol = (session.user as any).rol;
    if (!["superadmin", "administrador"].includes(rol)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};