import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const publicRoutes = ["/login", "/registro"];
  if (publicRoutes.includes(pathname)) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const superadminRoutes = ["/empresas", "/superadmin"];
  if (superadminRoutes.some((r) => pathname.startsWith(r))) {
    if ((session.user as any)?.rol !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  const adminRoutes = ["/usuarios"];
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    const rol = (session.user as any)?.rol;
    if (!["superadmin", "administrador"].includes(rol)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};