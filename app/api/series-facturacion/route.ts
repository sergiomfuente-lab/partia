import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;

  const series = await prisma.serieFacturacion.findMany({
    where:   { empresaId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(series);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const body      = await req.json();
  const { nombre, prefijo, contadorActual, prefijoAbono, contadorAbono } = body;

  if (!nombre || !prefijo) {
    return NextResponse.json({ error: "Nombre y prefijo son obligatorios" }, { status: 400 });
  }

  // Si es la primera serie, marcarla como predeterminada
  const existentes = await prisma.serieFacturacion.count({ where: { empresaId } });

  const serie = await prisma.serieFacturacion.create({
    data: {
      nombre,
      prefijo,
      contadorActual:  contadorActual  ?? 0,
      prefijoAbono:    prefijoAbono    ?? "",
      contadorAbono:   contadorAbono   ?? 0,
      predeterminada:  existentes === 0,
      activa:          true,
      empresaId,
    },
  });

  return NextResponse.json(serie, { status: 201 });
}