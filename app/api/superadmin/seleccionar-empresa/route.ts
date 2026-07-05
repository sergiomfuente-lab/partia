import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user as any).rol !== "superadmin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body      = await req.json();
  const empresaId = body.empresaId;

  if (empresaId) {
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  // Guardar empresa activa en el usuario
  await prisma.usuario.update({
    where: { id: session.user.id },
    data:  { empresaActivaId: empresaId ?? null },
  });

  return NextResponse.json({ ok: true, empresaId });
}