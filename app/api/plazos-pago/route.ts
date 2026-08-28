import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const soloActivos = searchParams.get("activos") === "true";

  const plazos = await prisma.plazoPago.findMany({
    where: { empresaId, ...(soloActivos && { activo: true }) },
    orderBy: { dias: "asc" },
  });

  return NextResponse.json(plazos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });

  const body = await req.json();
  const dias = parseInt(body.dias);

  if (isNaN(dias) || dias < 0) {
    return NextResponse.json({ error: "Introduce un número de días válido (0 o más)." }, { status: 400 });
  }

  const existente = await prisma.plazoPago.findUnique({
    where: { empresaId_dias: { empresaId, dias } },
  });
  if (existente) {
    if (existente.activo) {
      return NextResponse.json({ error: "Ese plazo ya existe." }, { status: 409 });
    }
    // Ya existía pero estaba desactivado: lo reactivamos en vez de duplicarlo.
    const reactivado = await prisma.plazoPago.update({
      where: { id: existente.id },
      data:  { activo: true },
    });
    return NextResponse.json(reactivado, { status: 200 });
  }

  const plazo = await prisma.plazoPago.create({
    data: { dias, empresaId },
  });

  return NextResponse.json(plazo, { status: 201 });
}
