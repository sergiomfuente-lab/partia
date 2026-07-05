import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol       = (session.user as any).rol;
  const empresaId = (session.user as any).empresaId;

  if (!["superadmin", "administrador"].includes(rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { id } = await params;
  const body   = await req.json();

  const usuario = await prisma.usuario.findFirst({ where: { id, empresaId } });
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // No se puede cambiar el rol a superadmin si no eres superadmin
  if (body.rol === "superadmin" && rol !== "superadmin") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data: {
      ...(body.nombre !== undefined && { nombre: body.nombre }),
      ...(body.rol    !== undefined && { rol:    body.rol }),
      ...(body.activo !== undefined && { activo: body.activo }),
    },
    select: {
      id: true, nombre: true, email: true,
      rol: true, activo: true, createdAt: true,
    },
  });

  return NextResponse.json(updated);
}