import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { passwordActual, passwordNueva } = body;

  if (!passwordNueva || passwordNueva.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: session.user.id } });
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Si tiene contraseña temporal no necesita verificar la actual
  if (!usuario.debeCambiarPassword) {
    const ok = await bcrypt.compare(passwordActual, usuario.password);
    if (!ok) return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });
  }

  const hash = await bcrypt.hash(passwordNueva, 10);

  await prisma.usuario.update({
    where: { id: session.user.id },
    data: {
      password:            hash,
      debeCambiarPassword: false,
    },
  });

  return NextResponse.json({ ok: true });
}