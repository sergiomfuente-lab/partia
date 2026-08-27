import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const anio      = new Date().getFullYear();

  const contador = await prisma.contadorFactura.findUnique({
    where: { empresaId_anio: { empresaId, anio } },
  });

  return NextResponse.json({ anio, contador: contador?.contador ?? 0 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const empresaId     = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const body          = await req.json();
  const { anio, contador } = body;

  if (!anio || contador === undefined) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const updated = await prisma.contadorFactura.upsert({
    where:  { empresaId_anio: { empresaId, anio } },
    update: { contador },
    create: { empresaId, anio, contador },
  });

  return NextResponse.json(updated);
}