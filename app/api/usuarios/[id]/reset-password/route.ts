import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol       = (session.user as any).rol;
  const empresaId = (session.user as any).empresaId;

  if (!["superadmin", "administrador"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { id }  = await params;
  const body    = await req.json();
  const { passwordTemporal } = body;

  if (!passwordTemporal || passwordTemporal.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findFirst({ where: { id, empresaId } });
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const hash = await bcrypt.hash(passwordTemporal, 10);

  await prisma.usuario.update({
    where: { id },
    data: {
      password:             hash,
      debeCambiarPassword:  true,
    },
  });

  return NextResponse.json({ ok: true });
}