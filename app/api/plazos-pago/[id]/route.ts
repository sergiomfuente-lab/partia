import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });

  const { id } = await params;
  const body   = await req.json();
  const { activo } = body;

  const plazo = await prisma.plazoPago.findFirst({ where: { id, empresaId } });
  if (!plazo) return NextResponse.json({ error: "Plazo no encontrado" }, { status: 404 });

  const updated = await prisma.plazoPago.update({
    where: { id },
    data:  { ...(activo !== undefined && { activo }) },
  });

  return NextResponse.json(updated);
}
