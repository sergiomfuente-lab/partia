import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;
  const body      = await req.json();

  const proveedor = await prisma.proveedor.findFirst({ where: { id, empresaId } });
  if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

  const updated = await prisma.proveedor.update({
    where: { id },
    data: {
      ...(body.nombre    !== undefined && { nombre:    body.nombre }),
      ...(body.cif       !== undefined && { cif:       body.cif }),
      ...(body.direccion !== undefined && { direccion: body.direccion }),
      ...(body.telefono  !== undefined && { telefono:  body.telefono }),
      ...(body.email     !== undefined && { email:     body.email }),
      ...(body.contacto  !== undefined && { contacto:  body.contacto }),
      ...(body.activo    !== undefined && { activo:    body.activo }),
    },
  });

  return NextResponse.json(updated);
}