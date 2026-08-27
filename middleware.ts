import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Deteccion simple de user-agent movil. Deliberadamente ligero y sin
// dependencias (nada de next-auth/prisma aqui): el middleware corre en el
// Edge Runtime, que no soporta el motor de Prisma. Solo marca la request
// con una cabecera; la decision de redirigir (que necesita sesion + rol,
// datos de servidor) se toma despues en app/(app)/layout.tsx, que corre
// en Node.js normal.
const MOBILE_UA_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const isMobile = MOBILE_UA_REGEX.test(ua);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-is-mobile", isMobile ? "1" : "0");

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Excluye assets estaticos y archivos con extension (imagenes, css, etc.)
  // para no interferir con next/image, /_next/static, favicon, etc.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
