import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get("clienteId");

  if (!clienteId) return NextResponse.json({ error: "clienteId requerido" }, { status: 400 });

  const ordenes = await prisma.orden.findMany({
    where: {
      clienteId,
      empresaId,
      facturaId: null,
      estado:    "completado",
    },
    include: {
      maquina:   { select: { id: true, marca: true, modelo: true } },
      servicios: { include: { tipoServicio: true } },
      repuestos: true,
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(ordenes);
}