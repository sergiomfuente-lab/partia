import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { id }    = await params;
  const body      = await req.json();

  const serie = await prisma.serieFacturacion.findFirst({ where: { id, empresaId } });
  if (!serie) return NextResponse.json({ error: "Serie no encontrada" }, { status: 404 });

  // Si se marca como predeterminada, desmarcar las demás
  if (body.predeterminada === true) {
    await prisma.serieFacturacion.updateMany({
      where: { empresaId },
      data:  { predeterminada: false },
    });
  }

  const updated = await prisma.serieFacturacion.update({
    where: { id },
    data: {
      ...(body.activa          !== undefined && { activa:          body.activa }),
      ...(body.predeterminada  !== undefined && { predeterminada:  body.predeterminada }),
      ...(body.contadorActual  !== undefined && { contadorActual:  body.contadorActual }),
      ...(body.contadorAbono   !== undefined && { contadorAbono:   body.contadorAbono }),
      ...(body.nombre          !== undefined && { nombre:          body.nombre }),
      ...(body.prefijo         !== undefined && { prefijo:         body.prefijo }),
      ...(body.prefijoAbono    !== undefined && { prefijoAbono:    body.prefijoAbono }),
    },
  });

  return NextResponse.json(updated);
}